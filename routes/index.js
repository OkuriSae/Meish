'use strict';
const express = require('express');
const router = express.Router();
const loader = require('../models/sequelize-loader');
const Sequelize = loader.Sequelize;
const User = require('../models/users');
const Personality = require('../models/personalities');
const Tag = require('../models/tags');
const authenticationEnsurer = require('./authentication-ensurer');

router.get('/', (req, res, next) => {
  (async () => {
    let users = await User.findAll({
      where: { visibility: 1 },
      include: [{
        model: Personality,
        required: false
      }]
    });
    let tagSummary = await Tag.findAll({
      attributes: [
        'tagname',
        [Sequelize.fn('count', Sequelize.col('tagname')), 'count']
      ],
      group: ["tagname"]
    });
    console.log(users);
    res.render('index', {
      me: req.user,
      users: users,
      tag: tagSummary
    });
  })();
});

router.get('/search', (req, res, next) => {
  let query = req.query.query;
  (async () => {
    let users = await User.findAll({
      where: {
        visibility: 1,
        "$tag.tagname$": query
      },
      include: [{
        model: Personality,
        required: false
      },{
        model: Tag,
        required: false
      }]
    });
    let tagSummary = await Tag.findAll({
      attributes: [
        'tagname',
        [Sequelize.fn('count', Sequelize.col('tagname')), 'count']
      ],
      group: ["tagname"]
    });
    console.log(users);
    res.render('index', {
      me: req.user,
      users: users,
      tag: tagSummary
    });
  })();
});

module.exports = router;
