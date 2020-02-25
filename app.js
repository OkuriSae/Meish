require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const helmet = require('helmet');
const session = require('express-session');
const passport = require('passport');
const compression = require('compression')

// モデルの読み込み
const User = require('./models/users');
const Tag = require('./models/tags');
const HashTag = require('./models/hashtags');
const Activity = require('./models/activities');
const Cheering = require('./models/cheerings');
const Parent = require('./models/parents');
const Tachie = require('./models/tachies');
const Personality = require('./models/personalities');
var cookieParser = require('cookie-parser');

// DB初期化
User.sync().then(() => {
  User.hasOne(Personality, { foreignKey: 'userId' });
  User.hasOne(Tag, { foreignKey: 'userId' });
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
const logoutRouter = require('./routes/logout');

const app = express();

process.env.s3Path = `https://${process.env.AWS_S3_BUCKET_NAME}.s3-ap-northeast-1.amazonaws.com/`;

app.use(compression());
app.use(helmet());

app.use(cookieParser());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('short'));
app.use(express.json({ type: 'application/*+json' }));
app.use(express.urlencoded({
  extended: false,
  type: 'application/x-www-form-urlencoded'
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: process.env.SessionSecret, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

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
      callbackURL: process.env.callbackURL
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
  passport.authenticate('twitter', { failureRedirect: '/' }),
  function (req, res) {
    res.redirect(`/i/${req.user.username}?mode=edit`);
  }
);

app.use('/', indexRouter);
app.use('/i/', iRouter);
app.use('/logout', logoutRouter); 

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.render('errors/404', { me: req.user });
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', { me: req.user });
});

module.exports = app;
