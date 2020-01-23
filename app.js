require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const helmet = require('helmet');
const session = require('express-session');
const passport = require('passport');
// モデルの読み込み
const User = require('./models/user');
const Tag = require('./models/tag');
const HashTag = require('./models/hashtag');
const Activity = require('./models/activity');
const Cheering = require('./models/cheering');
const Parent = require('./models/parent');
const Tachie = require('./models/tachie');
const Personality = require('./models/personality');

// DB初期化
User.sync().then(() => {
  Personality.belongsTo(User, { foreignKey: 'userId' });
  Personality.sync();
  HashTag.belongsTo(User, { foreignKey: 'userId' });
  HashTag.sync();
  Activity.belongsTo(User, { foreignKey: 'userId' });
  Activity.sync();
  Cheering.belongsTo(User, { foreignKey: 'userId' });
  Cheering.sync();
  Parent.belongsTo(User, { foreignKey: 'userId' });
  Parent.sync();
  Tachie.belongsTo(User, { foreignKey: 'userId' });
  Tachie.sync();
  Tag.belongsTo(User, { foreignKey: 'userId' });
  Tag.sync();
});

const TwitterStrategy = require('passport-twitter').Strategy;

const iRouter = require('./routes/i');
const indexRouter = require('./routes/index');
const loginRouter = require('./routes/login');
const logoutRouter = require('./routes/logout');
const profileRouter = require('./routes/profile');

const app = express();
app.use(helmet());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json({ type: 'application/*+json' }));
app.use(express.urlencoded({
  extended: false,
  type: 'application/x-www-form-urlencoded'
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: 'e55be81b307c1c09', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/u', profileRouter);
app.use('/i/', iRouter);

// セッションに保存
passport.serializeUser(function(user, done) {
  done(null, user);
});
  // セッションから復元 routerのreq.userから利用可能
passport.deserializeUser(function(user, done) {
  done(null, user);
});

// passport-twitterの設定
passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TwitterConsumerKey,
      consumerSecret: process.env.TwitterConsumerSecret,
      callbackURL: 'http://localhost:8000/auth/twitter/callback'
    },
    // 認証後の処理
    function(token, tokenSecret, profile, done) {
      return done(null, profile);
    })
);

// Twitter Login
app.get(
  '/auth/twitter', 
  passport.authenticate('twitter')
);
app.get(
  '/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect(`/i/${req.user.username}?mode=edit`);
  }
);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
