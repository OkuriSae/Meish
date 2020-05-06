'use strict';
const express = require('express');
const router = express.Router();
const loader = require('../models/sequelize-loader');
const Sequelize = loader.Sequelize;
const database = loader.database;
const { Op } = require("sequelize");
const User = require('../models/users');
const Personality = require('../models/personalities');
const Tag = require('../models/tags');

router.get('/', (req, res, next) => {
  let isToday = (i) => {
    let now = new Date();
    return i.day == `${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()}`;
  }
  let currentTag = dailyTags.filter(isToday);
  currentTag = currentTag.length > 0 ? currentTag[0].tag : null;
  (async () => {
    let users = await getAllUsers();
    let recomendedUsers = await getUsersByTag(currentTag);
    res.render('index', {
      me: req.user,
      results: shuffle(users).slice(0,24),
      tags: await getTags(),
      userCount: await User.count(),
      recommendTag: currentTag,
      recommendUsers: shuffle(recomendedUsers).slice(0,24)
    });
  })();
});

router.get('/tag_suggest', (req, res, next) => {
  (async () => {
    res.render('index', {
      me: req.user,
      tags: await getTags(),
      tag_suggest: true
    });
  })();
});

router.get('/allusers', (req, res, next) => {
  (async () => {
    res.render('index', {
      me: req.user,
      results:await getAllUsers(),
      tags: await getTags(),
      userCount: await User.count()
    });
  })();
});

async function getAllUsers() {
  let users = await User.findAll({
    include: [{
      model: Personality,
      where: { thumbnail_path: { [Op.ne]: null } }
    }],
    where : { visibility: 1 },
    order: [
      ['createdAt', 'DESC'],
    ],
  });
  return users.map(
    u => {
      return {
        username: u.username,
        thumbnail_path: u.personality.thumbnail_path,
        isSensitive: u.personality.isSensitive,
        createdAt: u.createdAt
      }
    }
  );
}

async function getUsersByUsername(query) {
  let users = await User.findAll({
    include: [{
      model: Personality,
      where: { 
        nameJa: { [Op.like]: `%${query}%`},
        thumbnail_path: { [Op.ne]: null }
      }
    }],
    where : { visibility: 1 },
    order: [
      ['createdAt', 'DESC'],
    ],
  });
  return users.map(
    u => {
      return {
        username: u.username,
        thumbnail_path: u.personality.thumbnail_path,
        isSensitive: u.personality.isSensitive,
        createdAt: u.createdAt
      }
    }
  );
}

async function getUsersByTag(query) {
  // sequelizeでうまくかけないのでベタがき
  // タグ検索文字列があれば、空白で区切られたタグの数だけJOINが増える（３つまで）
  let convLikeQery = i => i.match(`"`) ? i.replace(/"/gi, '') : `%${i}%`; // ""付きは全文一致、なしは部分一致
  let q = query ? query
    .replace('　', ' ')
    .split(' ')
    .slice(0,3)
    .map(convLikeQery) : [];
  let createTagJoinStr = (i) => { return `JOIN "tags" AS ${i} ON "users"."userId" = ${i}."userId" AND ${i}."tagname" like :${i} ` };
  let users = await database.query(`
    SELECT DISTINCT "username", "thumbnail_path", "isSensitive", "users"."createdAt"
    FROM "users" 
      JOIN "personalities" ON "users"."userId" = "personalities"."userId"
      ${ q[0] ? createTagJoinStr('a') : "" }
      ${ q[1] ? createTagJoinStr('b') : "" }
      ${ q[2] ? createTagJoinStr('c') : "" }
    WHERE
      "visibility" = 1
      AND "thumbnail_path" is not null
    ORDER BY "users"."createdAt" desc
    `
    , {
    replacements: { a: q[0], b: q[1], c: q[2] },
    type: Sequelize.QueryTypes.SELECT
  });
  return users.map(
    u => { 
      return {
        username: u.username,
        thumbnail_path: process.env.s3Path + u.thumbnail_path,
        isSensitive: u.isSensitive,
        createdAt: u.createdAt
      }
    }
  );
}

function shuffle(users) {
  // Fisher–Yates Shuffle
  for(var i = users.length - 1; i > 0; i--){
    var r = Math.floor(Math.random() * (i + 1));
    var tmp = users[i];
    users[i] = users[r];
    users[r] = tmp;
  }
  return users
}

async function getTags() {
  return Tag.findAll({
    attributes: [
      'tagname',
      [Sequelize.fn('count', Sequelize.col('tagname')), 'count']
    ],
    group: ["tagname"],
    order: [ [Sequelize.fn('count', Sequelize.col('tagname')), 'DESC' ] ],
    limit: '300'
  });
}

router.get('/about', (req, res, next) => {
  res.render('about', { me: req.user });
});

router.get('/howto', (req, res, next) => {
  res.render('howto', { me: req.user });
});

router.get('/terms', (req, res, next) => {
  res.render('terms', { me: req.user });
});

router.get('/privacy_policy', (req, res, next) => {
  res.render('privacy_policy', { me: req.user });
});

router.get('/specialthanks', (req, res, next) => {
  res.render('specialthanks', { me: req.user });
});

router.get('/events', (req, res, next) => {
  res.render('events', { me: req.user, dailyTags });
});

const dailyTags = [
  { day: '2020/4/6', tag: 'あつ森' },
  { day: '2020/4/7', tag: 'あつ森' },
  { day: '2020/4/8', tag: 'あつ森' },
  { day: '2020/4/9', tag: 'あつ森' },
  { day: '2020/4/10', tag: 'あつ森' },
  { day: '2020/4/11', tag: 'Ark' },
  { day: '2020/4/12', tag: 'Ark' },
  { day: '2020/4/13', tag: 'Ark' },
  { day: '2020/4/14', tag: 'Ark' },
  { day: '2020/4/15', tag: 'Ark' },
  { day: '2020/4/16', tag: 'Apex' },
  { day: '2020/4/17', tag: 'Apex' },
  { day: '2020/4/18', tag: 'Apex' },
  { day: '2020/4/19', tag: 'Apex' },
  { day: '2020/4/20', tag: 'Apex' },
  { day: '2020/4/21', tag: 'VRChat' },
  { day: '2020/4/22', tag: 'VRChat' },
  { day: '2020/4/23', tag: 'VRChat' },
  { day: '2020/4/24', tag: 'VRChat' },
  { day: '2020/4/25', tag: 'VRChat' },
  { day: '2020/4/26', tag: '麻雀' },
  { day: '2020/4/27', tag: '麻雀' },
  { day: '2020/4/28', tag: '麻雀' },
  { day: '2020/4/29', tag: '麻雀' },
  { day: '2020/4/30', tag: '麻雀' },
]

module.exports = router;
