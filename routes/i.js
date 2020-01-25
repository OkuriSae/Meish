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

let isMe = (req) => { return req.user ? req.params.username === req.user.username : false; };

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
          redirectHome(req, res);
        })();
        return;

      } else {
        // not found
        res.render('errors/404');
        return;
      }
    }

    if(!user.visibility && !isMe(req)){
      // is private
      res.render('errors/404');
      return;
    }
    if(req.user) console.log(req.user._json.profile_image_url_https);
    // show user page
    let renderParam = {
      me: req.user,
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
    if(user.visibility || isMe(req)){
      res.sendFile(path.resolve('./storage/i/' + req.url));
    } else {
      res.render('errors/404');
    }
  });
});

let redirectHome = (req, res) => { res.redirect(`/i/${req.user.username}?mode=edit`); };
let targetParse = (target) => { return isNaN(parseInt(target)) ? 0 : target; };
let isDeletePost = (req) => { return req.body.deleted == 1; };

// POST:公開状態
router.post('/:username/visibility', authenticationEnsurer, csrfProtection, (req, res, next) => {
  User.findByPk(req.user.id).then(user => {
    user.update({
      visibility : req.body.visibility == '0' ? '1' : '0'
    }).then(() => { redirectHome(req, res); });
  });
});

// POST:基本情報
router.post('/:username/basicinfo', authenticationEnsurer, csrfProtection, upload.single('img'), (req, res, next) => {
  Personality.findOne({where: { userId: req.user.id }}).then(personality => {
    (async () => {
      let data = {
        nameJa: req.body.nameJa,
        nameEn: req.body.nameEn,
        label: req.body.label,
        introduction: req.body.introduction
      }
      if (req.file) {
        // image saving
        data.tachie = `/i/${req.user.username}/img/${req.user.username}_main${sanitize(Path.extname(req.file.originalname))}`; 
        await saveImage('tachie', req.file, data.tachie);
      }
      await personality.update(data);
      await Tag.destroy({where: { userId: req.user.id }});
      for(let tag of req.body.tags.split(' ')) {
        await Tag.create({
          userId: req.user.id,
          tagname: tag
        });
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
    let data = isDeletePost(req) ? {
      userId: req.user.id,
      deleted: req.body.deleted
    } : {
      userId: req.user.id,
      name: req.body.name,
      comment: req.body.comment,
      deleted: req.body.deleted
    };
    if (hashtag) {
      hashtag.update(data).then(() => { redirectHome(req, res); });
    } else {
      HashTag.create(data).then(() => { redirectHome(req, res); });
    }
  }); 
});

// POST:活動情報
router.post('/:username/activity', authenticationEnsurer, csrfProtection, (req, res, next) => {
  Activity.findOne({
    where: {userId : req.user.id, activityId: targetParse(req.body.target), deleted: 0}
  }).then(activity => {
    let data = isDeletePost(req) ? {
      userId: req.user.id,
      deleted: req.body.deleted
    } : {
      userId: req.user.id,
      name: req.body.name,
      link: req.body.link,
      deleted: req.body.deleted
    };
    if (activity) {
      activity.update(data).then(() => { redirectHome(req, res); });
    } else {
      Activity.create(data).then(() => { redirectHome(req, res); });
    }
  });
});

// POST:応援情報
router.post('/:username/cheering', authenticationEnsurer, csrfProtection, (req, res, next) => {
  Cheering.findOne({
    where: {userId : req.user.id, cheeringId: targetParse(req.body.target), deleted: 0}
  }).then(cheering => {
    let data = isDeletePost(req) ? {
      userId: req.user.id,
      deleted: req.body.deleted
    } : {
      userId: req.user.id,
      name: req.body.name,
      link: req.body.link,
      deleted: req.body.deleted
    };
    if (cheering) {
      cheering.update(data).then(() => { redirectHome(req, res); });
    } else {
      Cheering.create(data).then(() => { redirectHome(req, res); });
    }
  });
});

// POST:パパママ
router.post('/:username/parent', authenticationEnsurer, csrfProtection, (req, res, next) => {
  Parent.findOne({
    where: {userId : req.user.id, parentId: targetParse(req.body.target), deleted: 0}
  }).then(parent => {
    let data = isDeletePost(req) ? {
      userId: req.user.id,
      deleted: req.body.deleted
    } : {
      userId: req.user.id,
      relationship: req.body.relationship,
      name: req.body.name,
      link: req.body.link,
      deleted: req.body.deleted
    };
    if (parent) {
      parent.update(data).then(() => { redirectHome(req, res); });
    } else {
      Parent.create(data).then(() => { redirectHome(req, res); });
    }
  });
});

// POST:tachie
router.post('/:username/img/tachie', authenticationEnsurer, csrfProtection, upload.single('img'), (req, res, next) => {
  Tachie.findOne({
    where: {userId : req.user.id, tachieId: targetParse(req.body.target), deleted: 0}
  }).then(tachie => {
    User.findOne({where: { userId: req.user.id }}).then(user => {

      if (!isDeletePost(req)) {
        (async () => {
          let data = {
            userId: req.user.id,
            name: req.body.name,
            comment: req.body.comment
          };

          if (req.file) {
            // image saving
            let filename = [
              sanitize(Path.basename(req.file.originalname, Path.extname(req.file.originalname))),
              sanitize(Path.extname(req.file.originalname))
            ].join('.');
            data.path = `/i/${user.username}/img/${user.username}_${filename}`; 
            await saveImage('tachie', req.file, data.path);
          }

          if (tachie) {
            await tachie.update(data);
          } else if (req.file) {
            await Tachie.create(data);
          }
          redirectHome(req, res);
        })();

      } else {
        // image destroy
        if (tachie) {
          fs.unlink(`storage/${tachie.path}`, () => {
            tachie.update({
              deleted: req.body.deleted
            }).then(() => { redirectHome(req, res); });
          });
        } else {
          res.render('errors/400', {message: 'image not exists'});
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
        (async () => {
          let data = {
            design_comment: req.body.comment
          };
          if (req.file) {
            data.design_path = `/i/${user.username}/img/${user.username}_design.${sanitize(Path.extname(req.file.originalname))}`; 
            await saveImage('design', req.file, data.design_path);
          } 
          await personality.update(data);
          redirectHome(req, res);
        })();

      } else {
        // image destroy
        fs.unlink(`storage/${personality.design_path}`, () => {
          personality.update({
            design_path: '',
            design_comment: ''
          }).then(() => { redirectHome(req, res); });
        });
      }
    });
  });
});

// POST:logo
router.post('/:username/img/logo', authenticationEnsurer, csrfProtection, upload.single('img'), (req, res, next) => {
  User.findOne({where: { userId: req.user.id }}).then(user => {
    Personality.findOne({where: { userId: req.user.id }}).then(personality => {

      if (!isDeletePost(req)) {
        (async () => {
          if (req.file) {
            let destName = `/i/${user.username}/img/${user.username}_logo.${sanitize(Path.extname(req.file.originalname))}`;
            await saveImage('logo', req.file, destName);
            await personality.update({ logo_path: destName });
          }
          redirectHome(req, res);
        })();

      } else {

        // image destroy
        fs.unlink(`storage/${personality.logo_path}`, () => {
          personality.update({
            logo_path: ''
          }).then(() => { redirectHome(req, res); });
        });
      }
    });
  });
});

// DELETE:account
router.post('/:username/destroy', authenticationEnsurer, csrfProtection, (req, res, next) => {
  User.findOne({where: { userId: req.user.id }}).then(user => {
    (async () => {
      fs.unlink(`storage/i/${req.user.username}`, () => {});
      await Tag.findAll({where: { userId: req.user.id }}).then((tags) => { if (tags.length) { tags.destroy(); }});
      await Tachie.findAll({where: { userId: req.user.id }}).then((tachies) => { if (tachies.length) {tachies.destroy(); }});
      await Activity.findAll({where: { userId: req.user.id }}).then((activities) => { if (activities.length) { activities.destroy(); }});
      await Parent.findAll({where: { userId: req.user.id }}).then((parents) => { if (parents.length) { parents.destroy(); }});
      await HashTag.findAll({where: { userId: req.user.id }}).then((hashtags) => { if (hashtags.length) { hashtags.destroy(); }});
      await Cheering.findAll({where: { userId: req.user.id }}).then((cheerings) => { if (cheerings.length) { cheerings.destroy(); }});
      await Personality.findOne({where: { userId: req.user.id }}).then((personality) => { if (personality) { personality.destroy(); }});
      await User.findOne({where: { userId: req.user.id }}).then((user) => { if (user) { user.destroy(); }});
      res.redirect(`/logout`);
    })();
  });
});

function saveImage(imagename, tmpFile, destName) {
  let tmpUnlink = (path) => { fs.unlink(path, () => {}); }

  let validator = new Promise((resolve, reject) => {
    let allowImageNames = ['logo', 'tachie', 'design'];
    let allowFileSize = 2 * (1024 ** 2); // 2MiB
    let allowMimeTypes = ['image/png', 'image/jpeg', 'image/gif'];
    let ext = Path.extname(tmpFile.originalname);
    let errorMessage = '';
    if (!allowImageNames.includes(imagename)) { errorMessage = 'imagename'; }
    if (tmpFile.size > allowFileSize) { errorMessage = 'filesize'; } 
    if (!allowMimeTypes.includes(tmpFile.mimetype)) { errorMessage = 'mimetype'; }
    if (!ext) { errorMessage = 'extension'; }
    if (errorMessage) {
      tmpUnlink(tmpFile.path);
      console.log(errorMessage);
      reject(new Error(errorMessage));
    } else {
      resolve(tmpFile.path);
    }
  });

  return new Promise((resolve, reject) => {
    validator.then((path) => {
      // saving
      Jimp.read(path).then(jimpImg => {
        tmpUnlink(path);
        jimpImg.write('storage' + destName);
        resolve(destName);

      }).catch((err) => {
        tmpUnlink(path);
        reject(err);
      });

    }).catch((err) => {
      reject(err.message);
    })
  });
}

module.exports = router;
