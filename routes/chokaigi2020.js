'use strict';
// common modules
const express = require('express');
const router = express.Router();

// models
const Personality = require('../models/personalities');
const User = require('../models/users');
const Tag = require('../models/tags');
const HashTag = require('../models/hashtags');
const Activity = require('../models/activities');
const Cheering = require('../models/cheerings');
const Parent = require('../models/parents');

// GET:超会議特設ページ
router.get('/', (req, res, next) => {
  (async () => {
    let characterList = await Tag.findAll({ where : { tagname: 'Vtuber' }});

    // shuffle
    for(var i = characterList.length - 1; i > 0; i--){
      var r = Math.floor(Math.random() * (i + 1));
      var tmp = characterList[i];
      characterList[i] = characterList[r];
      characterList[r] = tmp;
    }

    let characters = []
    for(let i = 0; i < characterList.length; i++){
      let where = { where: { userId: characterList[i].userId , deleted: 0 }, order: [["createdAt", "asc"]] };
      let character = [];
      character.user = await User.findByPk(characterList[i].userId);
      character.personality = await Personality.findByPk(characterList[i].userId);
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
    res.render('chokaigi2020', { me: req.user, characters});
  })();
});

module.exports = router;
