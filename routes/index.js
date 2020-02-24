'use strict';
const express = require('express');
const router = express.Router();
const loader = require('../models/sequelize-loader');
const Sequelize = loader.Sequelize;
const database = loader.database;
const User = require('../models/users');
const Personality = require('../models/personalities');
const Tag = require('../models/tags');
const authenticationEnsurer = require('./authentication-ensurer');

router.get('/', (req, res, next) => {
  let now = new Date();
  let nowDate = `${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()}`;
  let recommendTag = dailyTags.filter( i => { return i.day == nowDate; } );
  recommendTag = recommendTag.length > 0 ? recommendTag[0].tag : null;
  (async () => {
    res.render('index', {
      me: req.user,
      s3: process.env.s3Path,
      results: await getRandomUsers(),
      tags: await getTags(),
      userCount: await User.count(),
      recommendTag: recommendTag,
      recommendUsers: await getRandomUsers(recommendTag)
    });
  })();
});

router.get('/tag_suggest', (req, res, next) => {
  (async () => {
    res.render('index', {
      me: req.user,
      s3: process.env.s3Path,
      tags: await getTags(),
      tag_suggest: true
    });
  })();
});

router.get('/search', (req, res, next) => {
  let q = req.query.q;
  (async () => {
    res.render('index', {
      me: req.user,
      s3: process.env.s3Path,
      results: await getAllUsers(q),
      tags: await getTags(),
      q
    });
  })();
});

router.get('/allusers', (req, res, next) => {
  let query = req.query.query;
  (async () => {
    res.render('index', {
      me: req.user,
      s3: process.env.s3Path,
      results:await getAllUsers(query, 'latest'),
      tags: await getTags(),
      userCount: await User.count()
    });
  })();
});

async function getAllUsers(query, order) {
  // sequelizeでうまくかけないのでベタがき
  // タグ検索文字列があれば、空白で区切られたタグの数だけJOINが増える（３つまで）
  let convLikeQery = i => i.match(`"`) ? i.replace(/"/gi, '') : `%${i}%`; // ""付きは全文一致、なしは部分一致
  let q = query ? query
    .replace('　', ' ')
    .split(' ')
    .slice(0,3)
    .map(convLikeQery) : [];
  let createTagJoinStr = (i) => { return `JOIN "tags" AS ${i} ON "users"."userId" = ${i}."userId" AND ${i}."tagname" like :${i} ` };
  return database.query(`
    SELECT DISTINCT "username", "thumbnail_path", "isSensitive", "users"."createdAt"
    FROM "users" 
      JOIN "personalities" ON "users"."userId" = "personalities"."userId"
      ${ q[0] ? createTagJoinStr('a') : "" }
      ${ q[1] ? createTagJoinStr('b') : "" }
      ${ q[2] ? createTagJoinStr('c') : "" }
    WHERE
      "visibility" = 1
      AND "thumbnail_path" is not null
    ${ order == 'latest' ? `ORDER BY "users"."createdAt" desc` : "" }
    `
    , {
    replacements: { a: q[0], b: q[1], c: q[2] },
    type: Sequelize.QueryTypes.SELECT
  });
}

async function getRandomUsers(query) {

  let users = await getAllUsers(query);

  // Fisher–Yates Shuffle
  for(var i = users.length - 1; i > 0; i--){
    var r = Math.floor(Math.random() * (i + 1));
    var tmp = users[i];
    users[i] = users[r];
    users[r] = tmp;
  }
  
  return users.slice(0, 24);
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
  { day: '2020/3/1', tag: 'ケモ耳' },
  { day: '2020/3/2', tag: 'ケモ耳' },
  { day: '2020/3/3', tag: 'ケモ耳' },
  { day: '2020/3/4', tag: 'ケモ耳' },
  { day: '2020/3/5', tag: 'ケモ耳' },
  { day: '2020/3/6', tag: 'ケモ耳' },
  { day: '2020/3/7', tag: 'ケモ耳' },
  { day: '2020/3/8', tag: 'バーチャルキャスト' },
  { day: '2020/3/9', tag: 'バーチャルキャスト' },
  { day: '2020/3/10', tag: 'バーチャルキャスト' },
  { day: '2020/3/11', tag: 'バーチャルキャスト' },
  { day: '2020/3/12', tag: 'バーチャルキャスト' },
  { day: '2020/3/13', tag: 'バーチャルキャスト' },
  { day: '2020/3/14', tag: 'バーチャルキャスト' },
  { day: '2020/3/15', tag: '緑髪' },
  { day: '2020/3/16', tag: '緑髪' },
  { day: '2020/3/17', tag: '緑髪' },
  { day: '2020/3/18', tag: '緑髪' },
  { day: '2020/3/19', tag: '緑髪' },
  { day: '2020/3/20', tag: '緑髪' },
  { day: '2020/3/21', tag: '緑髪' },
  { day: '2020/3/22', tag: '和服' },
  { day: '2020/3/23', tag: '和服' },
  { day: '2020/3/24', tag: '和服' },
  { day: '2020/3/25', tag: '和服' },
  { day: '2020/3/26', tag: '和服' },
  { day: '2020/3/27', tag: '和服' },
  { day: '2020/3/28', tag: '和服' },
];

module.exports = router;
