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
    const results = await database.query(`
      SELECT "username", "thumbnail_path", "isSensitive"
      FROM "users" 
        JOIN "personalities" ON "users"."userId" = "personalities"."userId"
      WHERE
        "visibility" = 1
        AND "thumbnail_path" is not null
        ORDER BY random()
      LIMIT 30
      `, { type: Sequelize.QueryTypes.SELECT });
    let tagSummary = await Tag.findAll({
      attributes: [
        'tagname',
        [Sequelize.fn('count', Sequelize.col('tagname')), 'count']
      ],
      group: ["tagname"],
      order: [ [Sequelize.fn('count', Sequelize.col('tagname')), 'DESC' ] ],
      limit: '300'
    });
    let userCount = await User.count();
    
    res.render('index', {
      me: req.user,
      s3: process.env.s3Path,
      results: results,
      tags: tagSummary,
      userCount: userCount
    });
  })();
});

router.get('/search', (req, res, next) => {
  let query = req.query.query;
  (async () => {
    const results = await database.query(`
      SELECT DISTINCT "username", "thumbnail_path", "isSensitive"
      FROM "users" 
        JOIN "personalities" ON "users"."userId" = "personalities"."userId"
        JOIN "tags" ON "users"."userId" = "tags"."userId"
      WHERE
        "visibility" = 1
        AND "tagname" ilike $tagname
        AND "thumbnail_path" is not null
      LIMIT 30
      `
      , {
      bind: {tagname: query},
      type: Sequelize.QueryTypes.SELECT
    });
    let tagSummary = await Tag.findAll({
      attributes: [
        'tagname',
        [Sequelize.fn('count', Sequelize.col('tagname')), 'count']
      ],
      group: ["tagname"],
      order: [ [Sequelize.fn('count', Sequelize.col('tagname')), 'DESC' ] ],
      limit: '300'
    });
    res.render('index', {
      me: req.user,
      s3: process.env.s3Path,
      results: results,
      tags: tagSummary
    });
  })();
});

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
