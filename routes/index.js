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
  (async () => {
    res.render('index', {
      me: req.user,
      s3: process.env.s3Path,
      results: await getRandomUsers(),
      tags: await getTags(),
      userCount: await User.count()
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
  let query = req.query.query;
  (async () => {
    res.render('index', {
      me: req.user,
      s3: process.env.s3Path,
      results: await getRandomUsers(query),
      tags: await getTags(),
      query: query
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
  return database.query(`
    SELECT DISTINCT "username", "thumbnail_path", "isSensitive", "users"."createdAt"
    FROM "users" 
      JOIN "personalities" ON "users"."userId" = "personalities"."userId"
      ${ query ? `JOIN "tags" ON "users"."userId" = "tags"."userId"` : "" }
    WHERE
      "visibility" = 1
      ${ query ? `AND "tagname" ilike $tagname` : "" }
      AND "thumbnail_path" is not null
    ${ order == 'latest' ? `ORDER BY "users"."createdAt" desc` : "" }
    `
    , {
    bind: {tagname: query},
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
  
  return users.slice(0, 30);
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

router.get('/specialthanks', (req, res, next) => {
  let testers = [
    { name: "TesterName1", link: 'https://www.meish.me/i/Tester1' },
    { name: "TesterName2", link: 'https://www.meish.me/i/Tester2' },
    { name: "TesterName3", link: 'https://www.meish.me/i/Tester3' },
    { name: "TesterName4", link: 'https://www.meish.me/i/Tester4' },
    { name: "TesterName5", link: 'https://www.meish.me/i/Tester5' },
    { name: "TesterName6", link: 'https://www.meish.me/i/Tester6' },
    { name: "TesterName7", link: 'https://www.meish.me/i/Tester7' },
    { name: "TesterName8", link: 'https://www.meish.me/i/Tester8' },
    { name: "TesterName9", link: 'https://www.meish.me/i/Tester9' },
  ]
  res.render('specialthanks', { me: req.user, betatesters: testers });
});

module.exports = router;
