'use strict';
const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
