'use strict';
// common modules
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// models
const User = require('../models/users');
const Personality = require('../models/personalities');
const Tag = require('../models/tags');
const HashTag = require('../models/hashtags');
const Activity = require('../models/activities');
const Cheering = require('../models/cheerings');
const Parent = require('../models/parents');
const Tachie = require('../models/tachies');

// modules
const Jimp = require('jimp');
const Path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const s3  = new AWS.S3();
const multer = require('multer');
const upload = multer({
  dest: 'storage/img/tmp/'
});

let linkSanitize = (link) => { return link.split(':')[0].match(/http/gi) ? link : ""; };
let isMyPage = (req) => { return req.user ? (req.params.username === req.user.username) || req.user.username === process.env.ADMIN : false; };
let redirectTop = (req, res) => { res.redirect(`/`); };
let redirectMyPage = (req, res) => { res.redirect(`/i/${req.user.username}?mode=edit`); };
let parseTarget = (target) => { return isNaN(parseInt(target)) ? 0 : target; };
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
let getPageOwner = async (req) => { return await User.findOne({where: {username: req.params.username}}) };
let getMe = async (req) => { return await User.findByPk(req.user.id) };

// GET:ユーザーページ
router.get('/:username', csrfProtection, (req, res, next) => {
  (async () => {
    let pageOwner = await getPageOwner(req);

    if (!pageOwner) {
      // page owner not found

      if (isMyPage(req)) {
          let me = await getMe(req);
          if (me) {
            // exist old user (maybe change twitter screen_name)
            await deleteUser(req.user);
          }
          // new user (need terms agreement)
          res.render('agreement', {
            me: req.user,
            csrfToken: req.csrfToken()
          });
        return;

      } else {
        // page not found
        res.render('errors/404', { me: req.user });
        return;
      }
    }

    if (!pageOwner.visibility && !isMyPage(req)) {
      // 非公開のユーザーにアクセスした
      res.render('errors/404', { me: req.user });
      return;
    }

    if (req.query.mode == "edit" && !isMyPage(req)) {
      // 自分以外の?mode=editにアクセスした
      res.redirect(`/i/${req.params.username}`);
      return;
    }

    // valid access, show user page.
    let renderParams = {
      me: req.user,
      owner: pageOwner,
      visibility: pageOwner.visibility,
      isMyPage: isMyPage(req),
      mode: req.query.mode ? req.query.mode : "view",
      csrfToken: req.csrfToken()
    };
    let where = { where: { userId: pageOwner.userId , deleted: 0 }, order: [["createdAt", "asc"]] };
    renderParams.personality = await Personality.findByPk(pageOwner.userId);
    renderParams.tags = await Tag.findAll(where);
    renderParams.hashTags = await HashTag.findAll(where);
    renderParams.activities = await Activity.findAll(where);
    renderParams.cheerings = await Cheering.findAll(where);
    renderParams.parents = await Parent.findAll(where);
    renderParams.tachies = await Tachie.findAll(where);
    renderParams.personality = renderParams.personality;
    res.render('i', renderParams);
  })();
});

// POST:CreateUser
router.post('/:username', authenticationEnsurer, csrfProtection, (req, res, next) => {
  (async () => {
    let pageOwner = await getPageOwner(req);
    if (!pageOwner && isMyPage(req)) {
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
      await Activity.create({
          userId: req.user.id,
          name: 'Twitter',
          link: 'https://twitter.com/'+req.user.username,
      });
      redirectMyPage(req, res);
    } else {
      redirectTop(req, res);
    }
  })();
});

// POST:公開状態
router.post('/:username/visibility', authenticationEnsurer, csrfProtection, (req, res, next) => {
  (async () => {
    let me = await getMe(req);
    await me.update({ visibility : req.body.visibility == '0' ? '1' : '0' });
    redirectMyPage(req, res);
  })();
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

  (async () => {
    let personality = await Personality.findOne({where: { userId: req.user.id }});
    if (!personality) {
      res.render('errors/404', { me: req.user });
    }

    let updateData = {
      nameJa: req.body.nameJa.slice(0, 50),
      nameEn: req.body.nameEn.slice(0, 50),
      label: req.body.label.slice(0, 50),
      introduction: req.body.introduction.slice(0, 500),
      isSensitive: req.body.isSensitive == "on" ? "on" : ""
    }

    if (req.body.imageClear) {
      // delete profile images
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
        updateData.tachie = await saveImage(req.user.username, 'tachie', file.path, 1920, 1920, file.mimetype);
        
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
          tagname: tag.replace('#', '').replace(/\r?\n/g,"")
        });
      }
    }
    redirectMyPage(req, res);
  })();
});

// POST:ハッシュタグ
router.post('/:username/hashtag', authenticationEnsurer, csrfProtection, (req, res, next) => {
  (async () => {
    let updateData = {};
    updateData.userId = req.user.id,
    updateData.deleted = req.body.deleted % 2
    if (!isDeletePost(req)) {
      let format = (tag) => { return tag.replace('#', ''); };
      updateData.name = format(req.body.name).slice(0, 20);
      updateData.comment = req.body.comment.slice(0, 20);
    }

    let where = { where: { userId : req.user.id, tagId: parseTarget(req.body.target), deleted: 0 }};
    let hashtag = await HashTag.findOne(where);
    if (hashtag) {
      await hashtag.update(updateData);
    } else {
      await HashTag.create(updateData);
    }
    redirectMyPage(req, res);
  })();
});

// POST:活動情報
router.post('/:username/activity', authenticationEnsurer, csrfProtection, (req, res, next) => {
  (async () => {
    let updateData = {};
    updateData.userId = req.user.id,
    updateData.deleted = req.body.deleted % 2
    if (!isDeletePost(req)) {
      updateData.name = req.body.name.slice(0, 20);
      updateData.link = linkSanitize(req.body.link).slice(0, 200);
    }

    let where = { where: { userId : req.user.id, activityId: parseTarget(req.body.target), deleted: 0 }};
    let activity = await Activity.findOne(where);
    if (activity) {
      await activity.update(updateData);
    } else {
      await Activity.create(updateData);
    }
    redirectMyPage(req, res);
  })();
});

// POST:応援情報
router.post('/:username/cheering', authenticationEnsurer, csrfProtection, (req, res, next) => {
  (async () => {
    let updateData = {};
    updateData.userId = req.user.id,
    updateData.deleted = req.body.deleted % 2
    if (!isDeletePost(req)) {
      updateData.name = req.body.name.slice(0, 20);
      updateData.link = linkSanitize(req.body.link).slice(0, 200);
    }

    let where = {where: {userId : req.user.id, cheeringId: parseTarget(req.body.target), deleted: 0}};
    let cheering = await Cheering.findOne(where);
    if (cheering) {
      await cheering.update(updateData);
    } else {
      await Cheering.create(updateData);
    }
    redirectMyPage(req, res);
  })();
});

// POST:パパママ
router.post('/:username/parent', authenticationEnsurer, csrfProtection, (req, res, next) => {
  (async () => {
    let updateData = {};
    updateData.userId = req.user.id,
    updateData.deleted = req.body.deleted % 2
    if (!isDeletePost(req)) {
      updateData.relationship = req.body.relationship.slice(0, 20);
      updateData.name = req.body.name.slice(0, 20);
      updateData.link = linkSanitize(req.body.link).slice(0, 200);
    }

    let where = {where: {userId : req.user.id, parentId: parseTarget(req.body.target), deleted: 0}};
    let parent = await Parent.findOne(where);
    if (parent) {
      await parent.update(updateData);
    } else {
      await Parent.create(updateData);
    }
    redirectMyPage(req, res);
  })();
});

// POST:tachie
router.post('/:username/tachie', authenticationEnsurer, csrfProtection, upload.single('img'), (req, res, next) => {
  (async () => {
    // invalid post (tachie post limit)
    if (req.body.target == 'max') {
      redirectMyPage(req, res);
      return;
    }

    let where = { where: {userId : req.user.id, tachieId: parseTarget(req.body.target), deleted: 0 }};
    let tachie = await Tachie.findOne(where);

    if (isDeletePost(req)) {
      // invalid post (unexist tachie deleting)
      if (!tachie) {
        res.render('errors/400', { me: req.user, message: 'image not exists'});
        return;
      }
      // image destroy
      await deleteImage(tachie.path);
      await tachie.update({ deleted: req.body.deleted % 2 });

    } else {
      // image upload / update 
      let updateData = {};
      updateData.userId = req.user.id;
      updateData.name = req.body.name.slice(0, 20);
      updateData.comment = req.body.comment.slice(0, 60);

      if (req.file) {
        // image saving
        if (tachie) {
          await deleteImage(tachie.path);
        }
        imageValidation(req.file);
        updateData.path = await saveImage(req.user.username, `tachie_${Date.now()}`, req.file.path, 700, 1000, req.file.mimetype);

        // thumbnail
        if (req.body.useThumbnail) {
          let thumbnailS3Path = await createThumbnail(req.user.username, req.file);
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
    }
    redirectMyPage(req, res);
  })();
});

// POST:character design
router.post('/:username/design', authenticationEnsurer, csrfProtection, upload.single('img'), (req, res, next) => {
  (async () => {
    let personality = await Personality.findOne({where: { userId: req.user.id }});
    if (!personality) {
      res.render('errors/404', { me: req.user });
      return;
    }

    if (isDeletePost(req)) {
      // image destroy
        await deleteImage(personality.design_path);
        await personality.update({ design_path: '', design_comment: '' })

    } else {
      // image saving
      let updateData = { design_comment: req.body.comment.slice(0, 200) };
      if (req.file) {
        await deleteImage(personality.design_path);
        imageValidation(req.file);
        updateData.design_path = await saveImage(req.user.username, 'design', req.file.path, 1920, 1080, "image/jpeg");
      } 
      await personality.update(updateData);
    }
    redirectMyPage(req, res);
  })();
});

// POST: movie url
router.post('/:username/movie', authenticationEnsurer, csrfProtection, (req, res, next) => {
  (async () => {
    let personality = await Personality.findOne({where: { userId: req.user.id }});
    if (!personality) {
      res.render('errors/404', { me: req.user });
      return;
    }

    if (isDeletePost(req)) {
      // destroy
      await personality.update({ movie_id: '' })

    } else {
      // add
      let getYouTubeId = (url) => {
        return url ?
        url.replace('https://youtu.be/', '')
        .replace('https://www.youtube.com/watch?v=', '')
        .replace('https://www.youtube.com/embed/', '').split('&')[0] : '';
      };
      let updateData = { movie_id: getYouTubeId(req.body.movie_url).slice(0, 100) };
      await personality.update(updateData);
    }
    redirectMyPage(req, res);
  })();
});

// POST:logo
router.post('/:username/logo', authenticationEnsurer, csrfProtection, upload.single('img'), (req, res, next) => {
  (async () => {
    let personality = await Personality.findOne({where: { userId: req.user.id }});
    if (!personality) {
      res.render('errors/404', { me: req.user });
      return;
    }

    if (isDeletePost(req)) {
      // destroy
      await deleteImage(personality.logo_path);
      await personality.update({ logo_path: '' });

    } else {
      // image saving
      if (req.file) {
        await deleteImage(personality.logo_path);
        imageValidation(req.file);
        let destPath = await saveImage(req.user.username, 'logo', req.file.path, 1920, 1080, "image/jpeg");
        await personality.update({ logo_path: destPath });
      }
    }
    redirectMyPage(req, res);
  })();
});

// POST:ogp
router.post('/:username/ogp', authenticationEnsurer, csrfProtection, upload.single('img'), (req, res, next) => {
  (async () => {
    let personality = await Personality.findOne({where: { userId: req.user.id }});
    if (!personality) {
      res.render('errors/404', { me: req.user });
      return;
    }

    if (isDeletePost(req)) {
      await deleteImage(personality.ogp_path);
      await personality.update({ ogp_path: '' });

    } else {
      // image saving
      if (req.file) {
        await deleteImage(personality.ogp_path);
        imageValidation(req.file);
        let destPath = await createOgpImage(req.user.username, req.file);
        await personality.update({ ogp_path: destPath });
      }
    }
    redirectMyPage(req, res);
  })();
});

// DELETE:account
router.post('/:username/destroy', authenticationEnsurer, csrfProtection, (req, res, next) => {
  (async () => {
    let user = await User.findOne({where: { userId: req.user.id }});
    if (user) {
      await deleteUser(req.user);
    }
    res.redirect(`/logout`);
  })();
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
  let destPath = `i/${username}/${username}_${suffix}${getExt(mimeType)}`;
  let img = await Jimp.read(tmpPath);
  let w = img.bitmap.width;
  let h = img.bitmap.height;
  if (h > frame_h || w > frame_w) {
    if ((w/h) > (frame_w/frame_h)) {
      await img.resize(frame_w, Jimp.AUTO, Jimp.RESIZE_BICUBIC); // 横長
    } else {
      await img.resize(Jimp.AUTO, frame_h, Jimp.RESIZE_BICUBIC); // 縦長
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
  let waterPath = "public/img/logos/meish_logo_water.png";
  let destPath = `i/${username}/${username}_ogp${getExt(mimeType)}`;
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
