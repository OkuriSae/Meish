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
      }],
      order: [ [ Sequelize.fn('RANDOM') ] ],
      limit: '30'
    });
    let tagSummary = await Tag.findAll({
      attributes: [
        'tagname',
        [Sequelize.fn('count', Sequelize.col('tagname')), 'count']
      ],
      group: ["tagname"],
      order: [ [Sequelize.fn('count', Sequelize.col('tagname')), 'DESC' ] ]
    });
    res.render('index', {
      me: req.user,
      users: users,
      tags: tagSummary
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
      }],
      order: [ [ Sequelize.fn('RANDOM') ] ],
      limit: '30'
    });
    let tagSummary = await Tag.findAll({
      attributes: [
        'tagname',
        [Sequelize.fn('count', Sequelize.col('tagname')), 'count']
      ],
      group: ["tagname"],
      order: [ [Sequelize.fn('count', Sequelize.col('tagname')), 'DESC' ] ]
    });
    res.render('index', {
      me: req.user,
      users: users,
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

router.get('/agreement', (req, res, next) => {
  res.render('agreement', { me: req.user });
});

module.exports = router;
