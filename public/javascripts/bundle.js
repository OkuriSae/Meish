/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var jquery__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var jquery__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(jquery__WEBPACK_IMPORTED_MODULE_0__);


 //import Jimp from 'jimp';

var global = Function('return this;')();
global.jQuery = jquery__WEBPACK_IMPORTED_MODULE_0___default.a; //import * as Vibrant from 'node-vibrant';

var imageValidate = function imageValidate(fileInput, form) {
  var img = fileInput.prop('files')[0];

  if (!img) {
    return true;
  }

  if (!/\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF)$/.test(img.name) || !/(jpg|jpeg|png|gif)$/.test(img.type)) {
    alert('JPG、GIF、PNGファイルの画像を添付してください。');
    jquery__WEBPACK_IMPORTED_MODULE_0___default()(fileInput).val("");
    return false;
  } else if (2 * Math.pow(1024, 2) < img.size) {
    alert('2MB以下の画像を添付してください。');
    jquery__WEBPACK_IMPORTED_MODULE_0___default()(fileInput).val("");
    return false;
  }

  return true;
};
/*
const createOgpImage = async (filePath, cb) => {
  let origin = await Jimp.read(filePath);

  // アップロード画像リサイズ
  let frame_w = 1200;
  let frame_h = 630;
  await origin.cover(frame_w, frame_h);

  // ウォーターマークリサイズ
  let water_frame_w = frame_w/2;
  let water_frame_h = frame_h/2;
  let water = await Jimp.read("/img/meish_logo_water.png");
  let water_w = water.bitmap.width;
  let water_h = water.bitmap.height;
  if ( water_w > water_frame_w || water_h > water_frame_h ) {
    if ( (water_w/water_h) > (water_frame_w/water_frame_h) ) {
      await water.resize(water_frame_w, Jimp.AUTO);// 横長
    } else {
      await water.resize(Jimp.AUTO, water_frame_h);　// 縦長
    }
  }

  // ウォーターマーク合成
  await origin.composite(
    water, 
    origin.bitmap.width - water.bitmap.width, 
    origin.bitmap.height - water.bitmap.height, 
    { mode: Jimp.BLEND_SOURCE_OVER }
  );

  // jpeg 画質60 で書き出し
  return origin.background(0xFFFFFFFF).quality(60).getBase64(Jimp.MIME_JPEG, cb);
}
*/
// 編集モード/閲覧モード


jquery__WEBPACK_IMPORTED_MODULE_0___default()('#editLink').prop('href', location.href.split('?')[0] + "?mode=edit");
jquery__WEBPACK_IMPORTED_MODULE_0___default()('#viewLink').prop('href', location.href.split('?')[0]); // 検索Enter

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#QueryInput').keypress(function (e) {
  if (e.which == 13) {
    jquery__WEBPACK_IMPORTED_MODULE_0___default()('#SearchForm').submit();
  }
}); //// プロフィール
// プレビュー表示

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ProfileImageFileInput').change(function (e) {
  if (imageValidate(jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ProfileImageFileInput'))) {
    var file = e.target.files[0];
    var blobUrl = window.URL.createObjectURL(file);
    var uploadPreview = jquery__WEBPACK_IMPORTED_MODULE_0___default()('.profileImagePreview.imagePreview');
    uploadPreview.css('background-image', "url('".concat(blobUrl, "')"));
  }
});
jquery__WEBPACK_IMPORTED_MODULE_0___default()('#BackImageFileInput').change(function (e) {
  if (imageValidate(jquery__WEBPACK_IMPORTED_MODULE_0___default()('#BackImageFileInput'))) {
    var file = e.target.files[0];
    var blobUrl = window.URL.createObjectURL(file);
    var uploadPreview = jquery__WEBPACK_IMPORTED_MODULE_0___default()('.backImagePreview.imagePreview');
    uploadPreview.css('background-image', "url('".concat(blobUrl, "')"));
  }
}); // 更新

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#BasicInfoSubmitBtn').on('click', function () {
  if (imageValidate(jquery__WEBPACK_IMPORTED_MODULE_0___default()('#BackImageFileInput')) && imageValidate(jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ProfileImageFileInput'))) {
    jquery__WEBPACK_IMPORTED_MODULE_0___default()('#BasicInfoForm').submit();
  }
}); // 削除

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#BasicInfoDeleteBtn').hide(); //// ハッシュタグ
// ターゲット切り替え

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#HashTagSelection').change(function () {
  if (idx == "new") {
    jquery__WEBPACK_IMPORTED_MODULE_0___default()('#HashTagDeleteBtn').hide();
  } else {
    jquery__WEBPACK_IMPORTED_MODULE_0___default()('#HashTagDeleteBtn').show();
  }

  var idx = jquery__WEBPACK_IMPORTED_MODULE_0___default()('#HashTagSelection').val();
  jquery__WEBPACK_IMPORTED_MODULE_0___default()("#HashTagNameForm").val(jquery__WEBPACK_IMPORTED_MODULE_0___default()(".".concat(idx, ".hashTagHidden")).attr('name'));
  jquery__WEBPACK_IMPORTED_MODULE_0___default()("#HashTagCommentForm").val(jquery__WEBPACK_IMPORTED_MODULE_0___default()(".".concat(idx, ".hashTagHidden")).attr('comment'));
}); // 更新

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#HashTagSubmitBtn').on('click', function () {
  jquery__WEBPACK_IMPORTED_MODULE_0___default()('#HashTagForm').submit();
}); // ハッシュタグ削除

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#HashTagDeleteBtn').hide();
jquery__WEBPACK_IMPORTED_MODULE_0___default()('#HashTagDeleteBtn').on('click', function () {
  var form = jquery__WEBPACK_IMPORTED_MODULE_0___default()('#HashTagForm');
  jquery__WEBPACK_IMPORTED_MODULE_0___default()('#HashTagDeleted').val(1);
  form.submit();
}); //// 活動場所
// ターゲット切り替え

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ActivitySelection').change(function () {
  if (idx == "new") {
    jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ActivityDeleteBtn').hide();
  } else {
    jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ActivityDeleteBtn').show();
  }

  var idx = jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ActivitySelection').val();
  jquery__WEBPACK_IMPORTED_MODULE_0___default()("#ActivityNameForm").val(jquery__WEBPACK_IMPORTED_MODULE_0___default()(".".concat(idx, ".activityHidden")).attr('name'));
  jquery__WEBPACK_IMPORTED_MODULE_0___default()("#ActivityLinkForm").val(jquery__WEBPACK_IMPORTED_MODULE_0___default()(".".concat(idx, ".activityHidden")).attr('link'));
}); // 更新

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ActivitySubmitBtn').on('click', function () {
  jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ActivityForm').submit();
}); // 削除

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ActivityDeleteBtn').hide();
jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ActivityDeleteBtn').on('click', function () {
  var form = jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ActivityForm');
  jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ActivityDeleted').val(1);
  form.submit();
}); //// 応援方法
// ターゲット切り替え

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#CheeringSelection').change(function () {
  if (idx == "new") {
    jquery__WEBPACK_IMPORTED_MODULE_0___default()('#CheeringDeleteBtn').hide();
  } else {
    jquery__WEBPACK_IMPORTED_MODULE_0___default()('#CheeringDeleteBtn').show();
  }

  var idx = jquery__WEBPACK_IMPORTED_MODULE_0___default()('#CheeringSelection').val();
  jquery__WEBPACK_IMPORTED_MODULE_0___default()("#CheeringNameForm").val(jquery__WEBPACK_IMPORTED_MODULE_0___default()(".".concat(idx, ".cheeringHidden")).attr('name'));
  jquery__WEBPACK_IMPORTED_MODULE_0___default()("#CheeringLinkForm").val(jquery__WEBPACK_IMPORTED_MODULE_0___default()(".".concat(idx, ".cheeringHidden")).attr('link'));
}); // 更新

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#CheeringSubmitBtn').on('click', function () {
  jquery__WEBPACK_IMPORTED_MODULE_0___default()('#CheeringForm').submit();
}); // 削除

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#CheeringDeleteBtn').hide();
jquery__WEBPACK_IMPORTED_MODULE_0___default()('#CheeringDeleteBtn').on('click', function () {
  var form = jquery__WEBPACK_IMPORTED_MODULE_0___default()('#CheeringForm');
  jquery__WEBPACK_IMPORTED_MODULE_0___default()('#CheeringDeleted').val(1);
  form.submit();
}); //// パパ/ママ
// ターゲット切り替え

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ParentSelection').change(function () {
  if (idx == "new") {
    jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ParentDeleteBtn').hide();
  } else {
    jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ParentDeleteBtn').show();
  }

  var idx = jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ParentSelection').val();
  jquery__WEBPACK_IMPORTED_MODULE_0___default()("#ParentRelationshipForm").val(jquery__WEBPACK_IMPORTED_MODULE_0___default()(".".concat(idx, ".parentHidden")).attr('relationship'));
  jquery__WEBPACK_IMPORTED_MODULE_0___default()("#ParentNameForm").val(jquery__WEBPACK_IMPORTED_MODULE_0___default()(".".concat(idx, ".parentHidden")).attr('name'));
  jquery__WEBPACK_IMPORTED_MODULE_0___default()("#ParentLinkForm").val(jquery__WEBPACK_IMPORTED_MODULE_0___default()(".".concat(idx, ".parentHidden")).attr('link'));
}); // 更新

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ParentSubmitBtn').on('click', function () {
  jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ParentForm').submit();
}); // 削除

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ParentDeleteBtn').hide();
jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ParentDeleteBtn').on('click', function () {
  var form = jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ParentForm');
  jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ParentDeleted').val(1);
  form.submit();
}); //// 立ち絵
// ターゲット切り替え

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#TachieSelection').change(function () {
  var idx = jquery__WEBPACK_IMPORTED_MODULE_0___default()('#TachieSelection').val(); // ボタン表示制御

  if (idx == "new") {
    jquery__WEBPACK_IMPORTED_MODULE_0___default()('#TachieDeleteBtn').hide();
  } else {
    jquery__WEBPACK_IMPORTED_MODULE_0___default()('#TachieDeleteBtn').show();
  } // プレビュー画像切り替え


  jquery__WEBPACK_IMPORTED_MODULE_0___default()(".tachie.imagePreview").hide();
  jquery__WEBPACK_IMPORTED_MODULE_0___default()(".".concat(idx, ".tachie.imagePreview")).show();
  jquery__WEBPACK_IMPORTED_MODULE_0___default()(".tachieNameForm").val(jquery__WEBPACK_IMPORTED_MODULE_0___default()(".".concat(idx, ".tachieNameHidden")).val());
  jquery__WEBPACK_IMPORTED_MODULE_0___default()(".tachieCommentForm").val(jquery__WEBPACK_IMPORTED_MODULE_0___default()(".".concat(idx, ".tachieCommentHidden")).val());
  jquery__WEBPACK_IMPORTED_MODULE_0___default()('#TachieFileInput').val("");
  jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ThumbnailCheckForm').hide();
}); // プレビュー表示

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#TachieFileInput').change(function (e) {
  if (imageValidate(jquery__WEBPACK_IMPORTED_MODULE_0___default()('#TachieFileInput'))) {
    var file = e.target.files[0];

    if (!jquery__WEBPACK_IMPORTED_MODULE_0___default()('.tachieNameForm').val()) {
      jquery__WEBPACK_IMPORTED_MODULE_0___default()('.tachieNameForm').val(file.name.split('.')[0]);
    }

    var blobUrl = window.URL.createObjectURL(file);
    var uploadPreview = jquery__WEBPACK_IMPORTED_MODULE_0___default()('.tachie.upload.imagePreview');
    uploadPreview.css('background-image', "url('".concat(blobUrl, "')"));
    jquery__WEBPACK_IMPORTED_MODULE_0___default()(".tachie.imagePreview").hide();
    uploadPreview.show();
    jquery__WEBPACK_IMPORTED_MODULE_0___default()('#ThumbnailCheckForm').show();
  }
}); // 更新

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#TachieSubmitBtn').on('click', function () {
  if (imageValidate(jquery__WEBPACK_IMPORTED_MODULE_0___default()('#TachieFileInput'))) {
    jquery__WEBPACK_IMPORTED_MODULE_0___default()('#TachieForm').submit();
  }
}); // 削除

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#TachieDeleteBtn').hide();
jquery__WEBPACK_IMPORTED_MODULE_0___default()('#TachieDeleteBtn').on('click', function () {
  var form = jquery__WEBPACK_IMPORTED_MODULE_0___default()('#TachieForm');
  jquery__WEBPACK_IMPORTED_MODULE_0___default()('#TachieDeleted').val(1);
  form.submit();
}); //// キャラクターデザイン
// プレビューを表示

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#DesignFileInput').change(function (e) {
  if (imageValidate(jquery__WEBPACK_IMPORTED_MODULE_0___default()('#DesignFileInput'))) {
    var file = e.target.files[0];
    var blobUrl = window.URL.createObjectURL(file);
    var uploadPreview = jquery__WEBPACK_IMPORTED_MODULE_0___default()('.design.upload.imagePreview');
    uploadPreview.css('background-image', "url('".concat(blobUrl, "')"));
    jquery__WEBPACK_IMPORTED_MODULE_0___default()(".design.imagePreview").hide();
    uploadPreview.show();
  }
}); // 更新

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#DesignSubmitBtn').on('click', function () {
  if (imageValidate(jquery__WEBPACK_IMPORTED_MODULE_0___default()('#DesignFileInput'))) {
    jquery__WEBPACK_IMPORTED_MODULE_0___default()('#DesignForm').submit();
  }
}); // 削除

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#DesignDeleteBtn').on('click', function () {
  var form = jquery__WEBPACK_IMPORTED_MODULE_0___default()('#DesignForm');
  jquery__WEBPACK_IMPORTED_MODULE_0___default()('#DesignDeleted').val(1);
  form.submit();
}); //// ロゴ
// プレビューを表示

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#LogoFileInput').change(function (e) {
  if (imageValidate(jquery__WEBPACK_IMPORTED_MODULE_0___default()('#LogoFileInput'))) {
    var file = e.target.files[0];
    var blobUrl = window.URL.createObjectURL(file);
    var uploadPreview = jquery__WEBPACK_IMPORTED_MODULE_0___default()('.logo.upload.imagePreview');
    uploadPreview.css('background-image', "url('".concat(blobUrl, "')"));
    jquery__WEBPACK_IMPORTED_MODULE_0___default()(".logo.imagePreview").hide();
    uploadPreview.show();
  }
}); // 更新

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#LogoSubmitBtn').on('click', function () {
  if (imageValidate(jquery__WEBPACK_IMPORTED_MODULE_0___default()('#LogoFileInput'))) {
    jquery__WEBPACK_IMPORTED_MODULE_0___default()('#LogoForm').submit();
  }
}); // 削除

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#LogoDeleteBtn').on('click', function () {
  var form = jquery__WEBPACK_IMPORTED_MODULE_0___default()('#LogoForm');
  jquery__WEBPACK_IMPORTED_MODULE_0___default()('#LogoDeleted').val(1);
  form.submit();
}); //// OGP
// プレビューを表示

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#OgpFileInput').change(function (e) {
  if (imageValidate(jquery__WEBPACK_IMPORTED_MODULE_0___default()('#OgpFileInput'))) {
    var file = e.target.files[0];
    var blobUrl = window.URL.createObjectURL(file);
    var uploadPreview = jquery__WEBPACK_IMPORTED_MODULE_0___default()('.ogp.upload.imagePreview');
    uploadPreview.css('background-image', "url('".concat(blobUrl, "')"));
    jquery__WEBPACK_IMPORTED_MODULE_0___default()(".ogp.imagePreview").hide();
    uploadPreview.show();
  }
  /*
  if (imageValidate($('#OgpFileInput'))) {
    let file = e.target.files[0];
    let blobUrl = window.URL.createObjectURL(file);
    createOgpImage(blobUrl, (err, src) => {
      let uploadPreview = $('.ogp.upload.imagePreview');
      uploadPreview.css('background-image', `url('${src}')`);
      $(`.ogp.imagePreview`).hide();
      uploadPreview.show();
    });
  }
  */

}); // 更新

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#OgpSubmitBtn').on('click', function () {
  if (imageValidate(jquery__WEBPACK_IMPORTED_MODULE_0___default()('#OgpFileInput'))) {
    jquery__WEBPACK_IMPORTED_MODULE_0___default()('#OgpForm').submit();
  }
}); // 削除

jquery__WEBPACK_IMPORTED_MODULE_0___default()('#OgpDeleteBtn').on('click', function () {
  var form = jquery__WEBPACK_IMPORTED_MODULE_0___default()('#OgpForm');
  jquery__WEBPACK_IMPORTED_MODULE_0___default()('#OgpDeleted').val(1);
  form.submit();
});
/*
$(() => {
  // カラーパレット更新
  const image = new Image();
  image.onload = () => {
    Vibrant.from($(image).attr('src')).getPalette((err, palette) => {
      console.log(palette);
      $('#about').css('border-color', palette.LightVibrant.getHex());
      $('.line').css('color', palette.DarkMuted.getHex());
      $('.nameEn').css('color', palette.LightMuted.getHex());
      //$('.parallax-logo').css('background-color', palette.LightVibrant.getHex());
      $('hr').css('border-color', palette.Vibrant.getHex());
    });
  };
  image.src = $('#tachieSource').val();
});
*/

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = jQuery;

/***/ })
/******/ ]);