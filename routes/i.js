'use strict';
const express = require('express');
const router = express.Router();

const User = require('../models/users');
const Personality = require('../models/personalities');
const Tag = require('../models/tags');
const HashTag = require('../models/hashtags');
const Activity = require('../models/activities');
const Cheering = require('../models/cheerings');
const Parent = require('../models/parents');
const Tachie = require('../models/tachies');

const authenticationEnsurer = require('./authentication-ensurer');
const Jimp = require('jimp');
const Path = require('path');
const fs = require('fs');
const multer = require('multer');
const upload = multer({
  dest: 'storage/img/tmp/'
})
const sanitize = require("sanitize-filename");
const path = require('path');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
var AWS = require('aws-sdk');
var s3  = new AWS.S3();

let linkSanitize = (link) => { return link.split(':')[0].match(/http/gi) ? link : ""; };
let isMe = (req) => { return req.user ? req.params.username === req.user.username : false; };
let redirectTop = (req, res) => { res.redirect(`/`); };
let redirectHome = (req, res) => { res.redirect(`/i/${req.user.username}?mode=edit`); };
let targetParse = (target) => { return isNaN(parseInt(target)) ? 0 : target; };
let isDeletePost = (req) => { return req.body.deleted % 2 == 1; };
let getExt = (mimeType) => {
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    default:
      return ".jpg";
  }
}

// GET:ユーザーページ
router.get('/:username', csrfProtection, (req, res, next) => {
  User.findOne({where: {username: req.params.username}}).then(user => {
    if (!user) {
      if (isMe(req)) {
        (async () => {
          let user = await User.findOne({where: {userId: req.user.id}})
          if (user) {
            // exist old user
            await deleteUser(req.user);
          }
          // new user
          res.render('agreement', {
            me: req.user,
            csrfToken: req.csrfToken()
          });
        })();
        return;

      } else {
        // not found
        res.render('errors/404', { me: req.user });
        return;
      }
    }
    
    if (!user.visibility && !isMe(req)) {
      // 非公開のユーザーにアクセスした
      res.render('errors/404', { me: req.user });
      return;
    }

    if (req.query.mode == "edit" && !isMe(req)) {
      // 自分以外の?mode=editにアクセスした
      res.redirect(`/i/${req.params.username}`);
      return;
    }

    // show user page
    let renderParam = {
      me: req.user,
      owner: user,
      visibility: user.visibility,
      isMe: isMe(req),
      mode: req.query.mode ? req.query.mode : "view",
      csrfToken: req.csrfToken()
    };
    let where = {where: {userId: user.userId , deleted: 0}, order: [["createdAt", "asc"]]};
    (async () => {
      await user.update({updatedAt: Date.now()});
      renderParam.personality = await Personality.findByPk(user.userId);
      renderParam.tags = await Tag.findAll(where);
      renderParam.hashTags = await HashTag.findAll(where);
      renderParam.activities = await Activity.findAll(where);
      renderParam.cheerings = await Cheering.findAll(where);
      renderParam.parents = await Parent.findAll(where);
      renderParam.tachies = await Tachie.findAll(where);
      renderParam.personality = renderParam.personality;
      res.render('i', renderParam);
    })();
  });
});

// GET:ユーザー画像
router.get('/:username/img/:name', function (req, res, next) {
  User.findOne({where: {username: req.params.username}}).then(user => {
    if((user && user.visibility) || isMe(req)){
      res.sendFile(path.resolve('./storage/i/' + req.url));
    } else {
      res.render('errors/404', { me: req.user });
    }
  });
});

// POST:CreateUser
router.post('/:username', authenticationEnsurer, csrfProtection, (req, res, next) => {
  User.findOne({where: {username: req.params.username}}).then(user => {
    if (!user) {
      (async () => {
        await User.create({
            userId: req.user.id,
            username: req.user.username
        });
        await Personality.create({
            userId: req.user.id,
            icon: req.user._json.profile_image_url_https.replace('_normal', ''),
            nameJa: req.user.displayName,
            introduction: req.user._json.description
        });
        redirectHome(req, res);
      })();
    } else {
      redirectTop(req, res);
    }
  });
});

// POST:公開状態
router.post('/:username/visibility', authenticationEnsurer, csrfProtection, (req, res, next) => {
  User.findByPk(req.user.id).then(user => {
    user.update({
      visibility : req.body.visibility == '0' ? '1' : '0'
    }).then(() => { redirectHome(req, res); });
  });
});

// POST:基本情報
router.post(
  '/:username/basicinfo', 
  authenticationEnsurer, 
  csrfProtection, 
  upload.fields([
    {name: 'tachie', maxCount: 1},
    {name: 'back', maxCount: 1}
  ]), 
  (req, res, next) => {
  Personality.findOne({where: { userId: req.user.id }}).then(personality => {
    (async () => {

      let updateData = {
        nameJa: req.body.nameJa.slice(0, 50),
        nameEn: req.body.nameEn.slice(0, 50),
        label: req.body.label.slice(0, 50),
        introduction: req.body.introduction.slice(0, 500),
        isSensitive: req.body.isSensitive == "on" ? "on" : ""
      }

      if (req.body.imageClear) {
        await deleteImage(personality.tachie);
        await deleteImage(personality.back_path);
        updateData.tachie = null;
        updateData.back_path = null;

      } else {
        if (req.files.tachie) {
          // file saving
          await deleteImage(personality.tachie);
          let file = req.files.tachie[0];
          imageValidation(file);
          updateData.tachie = await saveImage(req.user.username, 'tachie', file.path, 1920, 1080, file.mimetype);
          
          // thumbnail
          if (!personality.thumbnail_path) {
            updateData.thumbnail_path = await createThumbnail(req.user.username, file);
          }
        }
  
        if (req.files.back) {
          // background
          await deleteImage(personality.back_path);
          let file = req.files.back[0];
          imageValidation(file);
          updateData.back_path = await saveImage(req.user.username, 'back', file.path, 1920, 1920, "image/jpeg");
        }
      }

      // data saving
      await personality.update(updateData);
      await Tag.destroy({where: { userId: req.user.id }});
      for(let tag of req.body.tags.slice(0, 100).replace(/　/gi, ' ').split(' ')) {
        if (tag) {
          await Tag.upsert({
            userId: req.user.id,
            tagname: tag
          });
        }
      }
      redirectHome(req, res);
    })();
    
  }).catch(() => {
    Personality.create({
      userId: req.user.id,
      icon: req.user._json.profile_image_url_https.replace('_normal', ''),
      nameJa: req.user.displayName,
      introduction: req.user._json.description
    }).then(() => { redirectHome(req, res); });
  });
});

// POST:ハッシュタグ
router.post('/:username/hashtag', authenticationEnsurer, csrfProtection, (req, res, next) => {
  HashTag.findOne({
    where: {userId : req.user.id, tagId: targetParse(req.body.target), deleted: 0}
  }).then(hashtag => {
    let format = (tag) => { return tag.slice(0,1).match('#') ? tag : '#'+tag; };
    let updateData = isDeletePost(req) ? {
      userId: req.user.id,
      deleted: req.body.deleted % 2
    } : {
      userId: req.user.id,
      name: format(req.body.name).slice(0, 21),
      comment: req.body.comment.slice(0, 20),
      deleted: req.body.deleted % 2
    };
    if (hashtag) {
      hashtag.update(updateData).then(() => { redirectHome(req, res); });
    } else {
      HashTag.create(updateData).then(() => { redirectHome(req, res); });
    }
  }); 
});

// POST:活動情報
router.post('/:username/activity', authenticationEnsurer, csrfProtection, (req, res, next) => {
  Activity.findOne({
    where: {userId : req.user.id, activityId: targetParse(req.body.target), deleted: 0}
  }).then(activity => {
    let updateData = isDeletePost(req) ? {
      userId: req.user.id,
      deleted: req.body.deleted % 2
    } : {
      userId: req.user.id,
      name: req.body.name.slice(0, 20),
      link: linkSanitize(req.body.link).slice(0, 200),
      deleted: req.body.deleted % 2
    };
    if (activity) {
      activity.update(updateData).then(() => { redirectHome(req, res); });
    } else {
      Activity.create(updateData).then(() => { redirectHome(req, res); });
    }
  });
});

// POST:応援情報
router.post('/:username/cheering', authenticationEnsurer, csrfProtection, (req, res, next) => {
  Cheering.findOne({
    where: {userId : req.user.id, cheeringId: targetParse(req.body.target), deleted: 0}
  }).then(cheering => {
    let updateData = isDeletePost(req) ? {
      userId: req.user.id,
      deleted: req.body.deleted % 2
    } : {
      userId: req.user.id,
      name: req.body.name.slice(0, 20),
      link: linkSanitize(req.body.link).slice(0, 200),
      deleted: req.body.deleted % 2
    };
    if (cheering) {
      cheering.update(updateData).then(() => { redirectHome(req, res); });
    } else {
      Cheering.create(updateData).then(() => { redirectHome(req, res); });
    }
  });
});

// POST:パパママ
router.post('/:username/parent', authenticationEnsurer, csrfProtection, (req, res, next) => {
  Parent.findOne({
    where: {userId : req.user.id, parentId: targetParse(req.body.target), deleted: 0}
  }).then(parent => {
    let updateData = isDeletePost(req) ? {
      userId: req.user.id,
      deleted: req.body.deleted % 2
    } : {
      userId: req.user.id,
      relationship: req.body.relationship.slice(0, 20),
      name: req.body.name.slice(0, 20),
      link: linkSanitize(req.body.link).slice(0, 200),
      deleted: req.body.deleted % 2
    };
    if (parent) {
      parent.update(updateData).then(() => { redirectHome(req, res); });
    } else {
      Parent.create(updateData).then(() => { redirectHome(req, res); });
    }
  });
});

// POST:tachie
router.post('/:username/img/tachie', authenticationEnsurer, csrfProtection, upload.single('img'), (req, res, next) => {
  if (req.body.target == 'max') {
    redirectHome(req, res);
    return;
  }
  Tachie.findOne({
    where: {userId : req.user.id, tachieId: targetParse(req.body.target), deleted: 0}
  }).then(tachie => {
    User.findOne({where: { userId: req.user.id }}).then(user => {

      if (!isDeletePost(req)) {
        (async () => {
          let updateData = {
            userId: req.user.id,
            name: req.body.name.slice(0, 20),
            comment: req.body.comment.slice(0, 60)
          };

          if (req.file) {
            // image saving
            if (tachie) {
              await deleteImage(tachie.path);
            }
            imageValidation(req.file);
            updateData.path = await saveImage(user.username, `tachie_${Date.now()}`, req.file.path, 700, 1000, req.file.mimetype);

            // thumbnail
            if (req.body.useThumbnail) {
              let thumbnailS3Path = await createThumbnail(user.username, req.file);
              let personality = await Personality.findOne({where: { userId: req.user.id }});
              await personality.update({ thumbnail_path: thumbnailS3Path});
            }
          }

          // data saving
          if (tachie) {
            await tachie.update(updateData);
          } else if (req.file) {
            await Tachie.create(updateData);
          }
          redirectHome(req, res);
        })();

      } else {
        // image destroy
        if (tachie) {
          (async () => {
            await deleteImage(tachie.path);
            await tachie.update({ deleted: req.body.deleted % 2 });
            redirectHome(req, res);
          })();
        } else {
          res.render('errors/400', { me: req.user, message: 'image not exists'});
        }
      }
    });
  });
});

// POST:character design
router.post('/:username/img/design', authenticationEnsurer, csrfProtection, upload.single('img'), (req, res, next) => {
  User.findOne({where: { userId: req.user.id }}).then(user => {
    Personality.findOne({where: { userId: req.user.id }}).then(personality => {

      if (!isDeletePost(req)) {
        // image saving
        (async () => {
          let updateData = { design_comment: req.body.comment.slice(0, 200) };
          if (req.file) {
            await deleteImage(personality.design_path);
            imageValidation(req.file);
            updateData.design_path = await saveImage(user.username, 'design', req.file.path, 1920, 1080, "image/jpeg");
          } 
          await personality.update(updateData);
          redirectHome(req, res);
        })();

      } else {
        // image destroy
        (async () => {
          await deleteImage(personality.design_path);
          await personality.update({
            design_path: '',
            design_comment: ''
          })
          redirectHome(req, res);
        })();
      }
    });
  });
});

// POST:logo
router.post('/:username/img/logo', authenticationEnsurer, csrfProtection, upload.single('img'), (req, res, next) => {
  User.findOne({where: { userId: req.user.id }}).then(user => {
    Personality.findOne({where: { userId: req.user.id }}).then(personality => {

      if (!isDeletePost(req)) {
        // image saving
        (async () => {
          if (req.file) {
            await deleteImage(personality.logo_path);
            imageValidation(req.file);
            let destPath = await saveImage(user.username, 'logo', req.file.path, 1920, 1080, "image/jpg");
            await personality.update({ logo_path: destPath });
          }
          redirectHome(req, res);
        })();

      } else {
        // image destroy
        (async () => {
          await deleteImage(personality.logo_path);
          await personality.update({ logo_path: '' });
          redirectHome(req, res);
        })();

      }
    });
  });
});

// POST:ogp
router.post('/:username/img/ogp', authenticationEnsurer, csrfProtection, upload.single('img'), (req, res, next) => {
  User.findOne({where: { userId: req.user.id }}).then(user => {
    Personality.findOne({where: { userId: req.user.id }}).then(personality => {

      if (!isDeletePost(req)) {
        // image saving
        (async () => {
          if (req.file) {
            await deleteImage(personality.ogp_path);
            imageValidation(req.file);
            let destPath = await createOgpImage(user.username, req.file);
            await personality.update({ ogp_path: destPath });
          }
          redirectHome(req, res);
        })();

      } else {
        // image destroy
        (async () => {
          await deleteImage(personality.logo_path);
          await personality.update({ logo_path: '' });
          redirectHome(req, res);
        })();

      }
    });
  });
});


// DELETE:account
router.post('/:username/destroy', authenticationEnsurer, csrfProtection, (req, res, next) => {
  User.findOne({where: { userId: req.user.id }}).then(user => {
    deleteUser(req.user).then(() => {
      res.redirect(`/logout`);
    });
  });
});

async function deleteUser(user) {
  // image deleting
  let personality = await Personality.findOne({where: { userId: user.id }});
  deleteImage(personality.tachie);
  deleteImage(personality.back_path);
  deleteImage(personality.design_path);
  deleteImage(personality.logo_path);
  deleteImage(personality.ogp_path);
  deleteImage(personality.thumbnail_path);
  let tachies = await Tachie.findAll({where: { userId: user.id }});
  tachies.forEach( tachie => {
    deleteImage(tachie.path);
  });
  // data deleting
  let isUser = { where: { userId: user.id }};
  let destroyAll = (models) => { models.forEach( model => { model.destroy(); }); }
  await Tag.findAll(isUser).then((tags) => { destroyAll(tags); });
  await Tachie.findAll(isUser).then((tachies) => { destroyAll(tachies); });
  await Activity.findAll(isUser).then((activities) => { destroyAll(activities); });
  await Parent.findAll(isUser).then((parents) => { destroyAll(parents); });
  await HashTag.findAll(isUser).then((hashtags) => { destroyAll(hashtags); });
  await Cheering.findAll(isUser).then((cheerings) => { destroyAll(cheerings); });
  await Personality.findOne(isUser).then((personality) => { personality.destroy(); });
  await User.findOne(isUser).then((user) => { user.destroy(); });
}

function imageValidation(tmpFile) {
    let allowFileSize = 2 * (1024 ** 2); // 2MiB
    let allowMimeTypes = ['image/png', 'image/jpeg'];
    let ext = Path.extname(tmpFile.originalname);
    
    if (tmpFile.size > allowFileSize) { throw new Error('filesize'); } 
    if (!allowMimeTypes.includes(tmpFile.mimetype)) { throw new Error('mimetype'); }
    if (!ext) { throw new Error('extension'); }
}

async function saveImage(username, suffix, tmpPath, frame_w, frame_h, mimeType) {
  let destPath = `i/${username}/img/${username}_${suffix}${getExt(mimeType)}`;
  let img = await Jimp.read(tmpPath);
  let w = img.bitmap.width;
  let h = img.bitmap.height;
  if (h > frame_h || w > frame_w) {
    if ((w/h) > (frame_w/frame_h)) {
      await img.resize(frame_w, Jimp.AUTO);// 横長
    } else {
      await img.resize(Jimp.AUTO, frame_h);　// 縦長
    }
  }

  if (mimeType == "image/jpeg") {
    await img.background(0xFFFFFFFF).quality(85);
  }

  let normalizedImagePath = getExt(mimeType);
  await img.writeAsync(normalizedImagePath);

  await s3Put(normalizedImagePath, mimeType , destPath);
  return `${destPath}?${new Date().getTime()}`;
}

async function createThumbnail(username, file) {
  return await saveImage(username, 'thumbnail', file.path, 400, 700, file.mimetype);
}

async function createOgpImage(username, file) {
  let mimeType = "image/jpeg";
  let frame_w = 1200;
  let frame_h = 630;
  let waterPath = "public/img/meish_logo_water.png";
  let destPath = `i/${username}/img/${username}_ogp${getExt(mimeType)}`;
  let origin = await Jimp.read(file.path);

  // アップロード画像リサイズ
  await origin.cover(frame_w, frame_h);

  // ウォーターマークリサイズ
  let water_frame_w = frame_w/2;
  let water_frame_h = frame_h/2;
  let water = await Jimp.read(waterPath);
  let water_w = water.bitmap.width;
  let water_h = water.bitmap.height;
  if ( water_w > water_frame_w || water_h > water_frame_h ) {
    if ( (water_w/water_h) > (water_frame_w/water_frame_h) ) {
      await water.resize(water_frame_w, Jimp.AUTO); // 横長
    } else {
      await water.resize(Jimp.AUTO, water_frame_h);　// 縦長
    }
  }

  // ウォーターマーク合成
  await origin.composite(
    water, 
    origin.bitmap.width - water.bitmap.width, 
    origin.bitmap.height - water.bitmap.height, 
    { mode: Jimp.BLEND_SOURCE_OVER }
  );

  // jpeg 画質60 で書き出し
  await origin.background(0xFFFFFFFF).quality(60).writeAsync(file.path+".jpg");
  await s3Put(file.path+".jpg", mimeType , destPath);
  return `${destPath}?${new Date().getTime()}`;
}

async function s3Put(filePath, mimeType , destPath) {
  const params = {
    Body: fs.readFileSync(filePath),
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: destPath,
    ContentType: mimeType,
    ACL: 'public-read'
  }
  console.log(`s3Put:`);
  console.log(params);
  return s3.putObject(params).promise();
}

async function deleteImage(key) {
  if (!key) { return; }
  var params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key.replace(process.env.s3Path,'')
  };
  console.log(`s3Delete:`);
  console.log(params);
  return s3.deleteObject(params).promise();
}

module.exports = router;
