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

let isMe = (req) => { return req.user ? req.params.username === req.user.username : false; };
let redirectHome = (req, res) => { res.redirect(`/i/${req.user.username}?mode=edit`); };
let targetParse = (target) => { return isNaN(parseInt(target)) ? 0 : target; };
let isDeletePost = (req) => { return req.body.deleted % 2 == 1; };

// GET:ユーザーページ
router.get('/:username', csrfProtection, (req, res, next) => {
  User.findOne({where: {username: req.params.username}}).then(user => {
    if (!user) {
      if (isMe(req)) {
        // create user record
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
          res.redirect('/agreement');
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

    if (req.user) console.log(req.user._json.profile_image_url_https);
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
        introduction: req.body.introduction.slice(0, 500)
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
          updateData.tachie = `i/${req.user.username}/img/${req.user.username}_main${sanitize(Path.extname(file.originalname))}`; 
          imageValidation(file);
          await saveImage(file.path, file.mimetype, updateData.tachie);
          // thumbnail
          if (!updateData.thumbnail_path) {
            let thumbnailTmpPath = file.path+"_thumbnail";
            updateData.thumbnail_path = `i/${req.user.username}/img/${req.user.username}_thumbnail${sanitize(Path.extname(file.originalname))}`; 
            await createThumbnail(file.path, thumbnailTmpPath);
            await saveImage(thumbnailTmpPath, file.mimetype, updateData.thumbnail_path);
          }
        }
  
        if (req.files.back) {
          await deleteImage(personality.back_path);
          let file = req.files.back[0];
          updateData.back_path = `i/${req.user.username}/img/${req.user.username}_back${sanitize(Path.extname(file.originalname))}`; 
          imageValidation(file);
          await saveImage(file.path, file.mimetype, updateData.back_path);
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

    let updateData = isDeletePost(req) ? {
      userId: req.user.id,
      deleted: req.body.deleted % 2
    } : {
      userId: req.user.id,
      name: req.body.name.slice(0, 20),
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
      link: req.body.link.slice(0, 200),
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
      link: req.body.link.slice(0, 200),
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
      link: req.body.link.slice(0, 200),
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
            let filename = 
              sanitize(Path.basename(req.file.originalname, Path.extname(req.file.originalname)))
              + sanitize(Path.extname(req.file.originalname));
              
            updateData.path = `i/${user.username}/img/${user.username}_tachie_${Date.now()}${sanitize(Path.extname(req.file.originalname))}`; 
            imageValidation(req.file);
            await saveImage(req.file.path, req.file.mimetype, updateData.path);

            // thumbnail
            if (req.body.useThumbnail) {
              let thumbnailTmpPath = req.file.path+"_thumbnail";
              await createThumbnail(req.file.path, thumbnailTmpPath);
              let thumbnailS3Path = `i/${req.user.username}/img/${req.user.username}_thumbnail${sanitize(Path.extname(req.file.originalname))}`; 
              await saveImage(thumbnailTmpPath, req.file.mimetype, thumbnailS3Path);
              let personality = await Personality.findOne({where: { userId: req.user.id }});
              await personality.update({ thumbnail_path: thumbnailS3Path });
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
            updateData.design_path = `i/${user.username}/img/${user.username}_design${sanitize(Path.extname(req.file.originalname))}`; 
            imageValidation(req.file);
            await saveImage(req.file.path, req.file.mimetype, updateData.design_path);
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
            let destPath = `i/${user.username}/img/${user.username}_logo${sanitize(Path.extname(req.file.originalname))}`;
            imageValidation(req.file);
            await saveImage(req.file.path, req.file.mimetype, destPath);
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
            await createOgpImage(req.file.path, req.file.path+".jpg");
            let destPath = `i/${user.username}/img/${user.username}_ogp.jpg`;
            await saveImage(req.file.path+".jpg", req.file.mimetype, destPath);
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
    (async () => {
      // image deleting
      let personality = await Personality.findOne({where: { userId: req.user.id }});
      deleteImage(personality.tachie);
      deleteImage(personality.back_path);
      deleteImage(personality.design_path);
      deleteImage(personality.logo_path);
      let tachies = await Tachie.findAll({where: { userId: req.user.id }});
      tachies.forEach( tachie => {
        deleteImage(tachie.path);
      });
      // data deleting
      let isUser = { where: { userId: req.user.id }};
      let destroyAll = (models) => { models.forEach( model => { model.destroy(); }); }
      await Tag.findAll(isUser).then((tags) => { destroyAll(tags); });
      await Tachie.findAll(isUser).then((tachies) => { destroyAll(tachies); });
      await Activity.findAll(isUser).then((activities) => { destroyAll(activities); });
      await Parent.findAll(isUser).then((parents) => { destroyAll(parents); });
      await HashTag.findAll(isUser).then((hashtags) => { destroyAll(hashtags); });
      await Cheering.findAll(isUser).then((cheerings) => { destroyAll(cheerings); });
      await Personality.findOne(isUser).then((personality) => { personality.destroy(); });
      await User.findOne(isUser).then((user) => { user.destroy(); });
      res.redirect(`/logout`);
    })();
  });
});

function imageValidation(tmpFile) {
    let allowFileSize = 2 * (1024 ** 2); // 2MiB
    let allowMimeTypes = ['image/png', 'image/jpeg', 'image/gif'];
    let ext = Path.extname(tmpFile.originalname);
    
    if (tmpFile.size > allowFileSize) { throw new Error('filesize'); } 
    if (!allowMimeTypes.includes(tmpFile.mimetype)) { throw new Error('mimetype'); }
    if (!ext) { throw new Error('extension'); }
}

async function saveImage(filePath, mimetype , destPath) {
  const params = {
    Body: fs.readFileSync(filePath),
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: destPath,
    ContentType: mimetype,
    ACL: 'public-read'
  }
  console.log(`s3Put:`);
  console.log(params);
  return s3.putObject(params).promise();
}

async function createThumbnail(filePath, destPath) {
  let img = await Jimp.read(filePath);
  let h = img.bitmap.height;
  let w = img.bitmap.width;
  let frame_h = 350;
  let frame_w = 200;
  if (h > frame_h || w > frame_w) {
    if ((w/h) > (frame_w/frame_h)) {
      await img.resize(frame_w, Jimp.AUTO);// 横長
    } else {
      await img.resize(Jimp.AUTO, frame_h);　// 縦長
    }
  }
  return img.writeAsync(destPath);
}

async function createOgpImage(filePath, destPath) {
  let origin = await Jimp.read(filePath);

  // アップロード画像リサイズ
  let frame_w = 1200;
  let frame_h = 630;
  await origin.cover(frame_w, frame_h); 

  // ウォーターマークリサイズ
  let water_frame_w = frame_w/2;
  let water_frame_h = frame_h/2;
  let water = await Jimp.read("public/img/meish_logo_water.png");
  let water_w = water.bitmap.width;
  let water_h = water.bitmap.height;
  if ( water_w > water_frame_w || water_h > water_frame_h ) {
    if ( (water_w/water_h) > (water_frame_w/water_frame_h) ) {
      await water.resize(water_frame_w, Jimp.AUTO);// 横長
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
  return origin.background(0xFFFFFFFF).quality(60).writeAsync(destPath);
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
