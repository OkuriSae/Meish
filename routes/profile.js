'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const uuid = require('uuid');
const Personality = require('../models/personality');
const User = require('../models/user');

// 新規ユーザー登録ページ
router.get('/new', authenticationEnsurer, (req, res, next) => {
  res.render('new', { user: req.user });
});

// 新規ユーザー登録
router.post('/:user', authenticationEnsurer, (req, res, next) => {
  let now = new Date();
  User.findOne({
    where: {
      userId: req.user.id
    },
  }).then((user) => {
    req.body.personalities.forEach((personality) => {
      Personality.upsert({
        userId: user.userId,
        category: personality.category.slice(0, 255) || '???',
        subject: personality.subject,
        content: personality.content,
        createdAt: now,
        updatedAt: now
      }).then((personality) => {
        
      });
    });
  });
  res.redirect('/' + req.user.id);
});

// プロフィールページ
router.get('/:user', authenticationEnsurer, (req, res, next) => {
  User.findOne({
    where: {
      userId: req.user.id
    },
  }).then((user) => {
    Personality.findOne({
      where: {
        userId: user.userId
      },
      order: [['"updatedAt"', 'DESC']]
    });
  }).then((personalities) => {
    res.render('profile', {
      username: req.user,
      personalities: personalities
    });
  });
});

// ユーザーデータ削除（テスト用）
function deleteUser(userId, done, err) {
  const promiseUserDestroy = User.findAll({
    where: { userId: userId }
  }).then((user) => {
    return Promise.all(user.map((u) => { return u.destroy(); }));
  });

  Personality.findAll({
    where: { userId: userId }
  }).then((personalities) => {
    const promises = availabilities.map((a) => { return a.destroy(); });
    promises.push(promiseUserDestroy);
    return Promise.all(promises);
  }).then(() => {
    if (err) return done(err);
    done();
  });
}

router.deleteUser = deleteUser;

module.exports = router;
