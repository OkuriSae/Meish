'use strict';
// common modules
const express = require('express');
const router = express.Router();

// models
const loader = require('../models/sequelize-loader');
const Sequelize = loader.Sequelize;
const database = loader.database;
const { Op } = require("sequelize");
const Personality = require('../models/personalities');
const User = require('../models/users');
const Tag = require('../models/tags');
const HashTag = require('../models/hashtags');
const Activity = require('../models/activities');
const Cheering = require('../models/cheerings');
const Parent = require('../models/parents');

// GET:検索結果ページ
router.get('/', (req, res, next) => {
  (async () => {
    let q = req.query ? req.query.q.replace('　', ' ').trim() : false;
    if (!q) {
      res.redirect(`/`);
      return;
    }

    let usersByUsername = await getUsersByUsername(q);
    let usersByTag = await getUsersByTag(q);
    let users = Array.from(new Set(usersByUsername.concat(usersByTag)));
    let characterList = shuffle(users);
    
    let characters = []
    for(let i = 0; i < characterList.length; i++){
      let where = { where: { userId: characterList[i] , deleted: 0 }, order: [["createdAt", "asc"]] };
      let character = [];
      character.user = await User.findByPk(characterList[i]);
      character.personality = await Personality.findByPk(characterList[i]);
      character.personality.introduction = character.personality.introduction.length > 200 ? character.personality.introduction.slice(0,200) + '...' : character.personality.introduction;
      character.tags = await Tag.findAll(where);
      character.hashTags = await HashTag.findAll(where);
      character.hashTags = character.hashTags.length > 3 ? character.hashTags.slice(0,3) : character.hashTags;
      character.activities = await Activity.findAll(where);
      character.activities = character.activities.length > 3 ? character.activities.slice(0,3) : character.activities;
      character.cheerings = await Cheering.findAll(where);
      character.cheerings = character.cheerings.length > 3 ? character.cheerings.slice(0,3) : character.cheerings;
      character.parents = await Parent.findAll(where);
      character.parents = character.parents.length > 3 ? character.parents.slice(0,3) : character.parents;
      if (character.user.visibility == 1 && character.user.deleted == 0 && (character.personality.tachie || character.personality.back_path)){
        characters.push(character);
      }
    }
    res.render('search', { me: req.user, characters, q});
  })();
});

async function getUsersByUsername(query) {
  let users = await User.findAll({
    include: [{
      model: Personality,
      where: { 
        nameJa: { [Op.like]: `%${query}%`},
        thumbnail_path: { [Op.ne]: null }
      }
    }],
    where : { visibility: 1 }
  });
  return users.map( u => u.userId );
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
    SELECT DISTINCT "users"."userId"
    FROM "users" 
      JOIN "personalities" ON "users"."userId" = "personalities"."userId"
      ${ q[0] ? createTagJoinStr('a') : "" }
      ${ q[1] ? createTagJoinStr('b') : "" }
      ${ q[2] ? createTagJoinStr('c') : "" }
    WHERE
      "visibility" = 1
      AND "thumbnail_path" is not null
    `
    , {
    replacements: { a: q[0], b: q[1], c: q[2] },
    type: Sequelize.QueryTypes.SELECT
  });
  return users.map( u => u.userId );
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

module.exports = router;