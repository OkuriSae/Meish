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
const multer = require('multer');
const upload = multer({
  dest: 'storage/img/tmp/'
});
const ImageGenerator = require('./ImageGenerator');
const S3Client = require('./S3Client');

let linkSanitize = (link) => { return link.split(':')[0].match(/http/gi) ? link : ""; };
let isMyPage = (req) => { return req.user ? (req.params.username === req.user.username) || req.user.username === process.env.ADMIN : false; };
let redirectTop = (req, res) => { res.redirect(`/`); };
let redirectMyPage = (req, res) => { res.redirect(`/i/${req.user.username}?mode=edit`); };
let parseTarget = (target) => { return isNaN(parseInt(target)) ? 0 : target; };
let isDeletePost = (req) => { return req.body.deleted % 2 == 1; };
let getPageOwner = async (req) => { return await User.findOne({where: {username: req.params.username}}) };
let getMe = async (req) => { return await User.findByPk(req.user.id) };

const limitString = (str, length) => { return Array.from(str).slice(0, length).join(); };

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
      nameJa: limitString(req.body.nameJa, 50),
      nameEn: limitString(req.body.nameEn, 50),
      label: limitString(req.body.label, 50),
      introduction: limitString(req.body.introduction, 500),
      isSensitive: req.body.isSensitive == "on" ? "on" : ""
    }

    if (req.body.imageClear) {
      // delete profile images
      await S3Client.delete(personality.tachie);
      await S3Client.delete(personality.back_path);
      updateData.tachie = null;
      updateData.back_path = null;

    } else {
      const im = new ImageManager(req.user.username);
      if (req.files.tachie) {
        updateData.tachie = await im.updateProfileImage(req.files.tachie[0], personality.tachie);
        
        // thumbnail (only first time)
        if (!personality.thumbnail_path) {
          updateData.thumbnail_path = await im.updateThumbnail(req.files.tachie[0]);
        }
      }

      if (req.files.back) {
        updateData.back_path = await im.updateProfileBackground(req.files.back[0], personality.back_path);
      }
    }

    // data saving
    await personality.update(updateData);
    await Tag.destroy({where: { userId: req.user.id }});
    for(let tag of limitString(req.body.tags, 100).replace(/　/gi, ' ').split(' ')) {
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

// POST:サブプロフィール
router.post('/:username/subprofile', authenticationEnsurer, csrfProtection, (req, res, next) => {
  (async () => {
    let personality = await Personality.findOne({where: { userId: req.user.id }});
    if (!personality) {
      res.render('errors/404', { me: req.user });
    }
    let updateData = {};
    if (isDeletePost(req)) {
      updateData.subprofile = '';
    } else {
      updateData.subprofile = limitString(req.body.subprofile, 1000);
    }

    await personality.update(updateData);
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
      updateData.name = limitString(format(req.body.name), 20);
      updateData.comment = limitString(req.body.comment, 20);
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
      updateData.name = limitString(req.body.name, 20);
      updateData.link = limitString(linkSanitize(req.body.link), 200);
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
      updateData.name = limitString(req.body.name, 20);
      updateData.link = limitString(linkSanitize(req.body.link), 200);
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
      updateData.relationship = limitString(req.body.relationship, 20);
      updateData.name = limitString(req.body.name, 20);
      updateData.link = limitString(linkSanitize(req.body.link), 200);
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
      await S3Client.delete(tachie.path);
      await tachie.update({ deleted: req.body.deleted % 2 });

    } else {
      // image upload / update 
      let updateData = {};
      updateData.userId = req.user.id;
      updateData.name = limitString(req.body.name, 20);
      updateData.comment = limitString(req.body.comment, 60);

      if (req.file) {
        const im = new ImageManager(req.user.username);
        updateData.path = await im.updateTachie(req.file, tachie ? tachie.path : null);

        // thumbnail
        if (req.body.useThumbnail) {
          let personality = await Personality.findOne({ where: { userId: req.user.id } });
          const thumbnail_path = await im.updateThumbnail(req.file, personality.thumbnail_path);
          await personality.update({ thumbnail_path });
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
      await S3Client.delete(personality.design_path);
      await personality.update({ design_path: '', design_comment: '' })

    } else {
      let updateData = { design_comment: limitString(req.body.comment, 200) };
      if (req.file) {
        const im = new ImageManager(req.user.username);
        updateData.design_path = await im.updateCharacterDesign(req.file, personality.design_path);
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
      let updateData = { movie_id: limitString(getYouTubeId(req.body.movie_url), 100) };
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
      await S3Client.delete(personality.logo_path);
      await personality.update({ logo_path: '' });

    } else {
      // image saving
      if (req.file) {
        const im = new ImageManager(req.user.username);
        const logo_path = await im.updateLogoImage(req.file, personality.logo_path);
        await personality.update({ logo_path });
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
      await S3Client.delete(personality.ogp_path);
      await personality.update({ ogp_path: '' });

    } else {
      // image saving
      if (req.file) {
        const im = new ImageManager(req.user.username);
        const ogp_path = await im.updateOgpImage(req.file, personality.ogp_path);
        await personality.update({ ogp_path });
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
  S3Client.delete(personality.tachie);
  S3Client.delete(personality.back_path);
  S3Client.delete(personality.design_path);
  S3Client.delete(personality.logo_path);
  S3Client.delete(personality.ogp_path);
  S3Client.delete(personality.thumbnail_path);
  let tachies = await Tachie.findAll({where: { userId: user.id }});
  tachies.forEach( tachie => {
    S3Client.delete(tachie.path);
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

class ImageManager {

  constructor(username) {
    this.username = username;
  }

  async save(source, suffix, options) {
    const outPath = await ImageGenerator.create(source, options);
    const mimetype = options.mimetype || source.mimetype;
    const destPath = `i/${this.username}/${this.username}_${suffix}${ImageGenerator.getExt(mimetype)}`;
    await S3Client.put(outPath, mimetype, destPath);
    return `${destPath}?${new Date().getTime()}`;
  }
  
  async updateProfileImage (source, oldPath) {
    S3Client.delete(oldPath);
    return await this.save(source, 'tachie', { mode: 'resize', w: 1920, h: 1920 });
  }
  async updateProfileBackground (source, oldPath) {
    S3Client.delete(oldPath);
    return await this.save(source, 'back', { mode: 'resize', w: 1920, h: 1920, mimetype: "image/jpeg" });
  }
  async updateThumbnail (source, oldPath) {
    S3Client.delete(oldPath);
    return await this.save(source, 'thumbnail', { mode: 'resize', w: 400, h: 700 });
  }
  async updateTachie (source, oldPath) {
    S3Client.delete(oldPath);
    return await this.save(source, `tachie_${Date.now()}`, { mode: 'resize', w: 700, h: 1000 });
  }
  async updateCharacterDesign (source, oldPath) {
    S3Client.delete(oldPath);
    return await this.save(source, 'design', { mode: 'resize', w: 1920, h: 1080, mimetype: "image/jpeg" });
  }
  async updateLogoImage (source, oldPath) {
    S3Client.delete(oldPath);
    return await this.save(source, 'logo', { mode: 'resize', w: 1920, h: 1080, mimetype: "image/jpeg" });
  }
  async updateOgpImage (source, oldPath) {
    S3Client.delete(oldPath);
    return await this.save(source, 'ogp', { mode: 'crop', w: 1200, h: 630, water: true, mimetype: "image/jpeg" });
  }
}

module.exports = router;
