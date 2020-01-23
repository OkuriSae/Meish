'use strict';
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Tachie = require('../models/tachie');
const authenticationEnsurer = require('./authentication-ensurer');

const dummyTachies = [
  {path: "img/dummy/OkuriSae_tachie2.png", link: "/i/OkuriSae"},
  {path: "img/dummy/d0.png", link: "/"},
  {path: "img/dummy/d9.png", link: "/"},
  {path: "img/dummy/d10.png", link: "/"},
  {path: "img/dummy/d1.png", link: "/"},
  {path: "img/dummy/d2.png", link: "/"},
  {path: "img/dummy/d3.png", link: "/"},
  {path: "img/dummy/d4.png", link: "/"},
  {path: "img/dummy/d5.png", link: "/"},
  {path: "img/dummy/d6.png", link: "/"},
  {path: "img/dummy/d7.png", link: "/"},
  {path: "img/dummy/d8.png", link: "/"},
  {path: "img/dummy/d11.png", link: "/"},
]

router.get('/', (req, res, next) => {
  Tachie.findAll().then((tachies) => {
    res.render('index', {
      me: req.user,
      tachies: dummyTachies
    });
  });
});

router.get('/search', (req, res, next) => {
  let query = req.query.query;
  User.findAll({where:{username: query}}).then((users) => {
    console.log(`users:${users}`);
    res.render('index', {
      me: req.user,
      tachies: dummyTachies
    });
  });
});

module.exports = router;
