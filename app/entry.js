'use strict';
import $ from 'jquery';
import Jimp from 'jimp';
const global = Function('return this;')();
global.jQuery = $;
import * as Vibrant from 'node-vibrant';

const imageValidate = (fileInput, form) => {
  let img = fileInput.prop('files')[0]; 
  if (!img) { return true; }
  if (!/\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF)$/.test(img.name) || !/(jpg|jpeg|png|gif)$/.test(img.type)) {
    alert('JPG、GIF、PNGファイルの画像を添付してください。');
    $(fileInput).val(""); 
    return false;
  } else if (2*(1024**2) < img.size) {
    alert('2MB以下の画像を添付してください。');
    $(fileInput).val(""); 
    return false;
  }
  return true;
} 


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

// 編集モード/閲覧モード
$('#editLink').prop('href', location.href.split('?')[0] + "?mode=edit");
$('#viewLink').prop('href', location.href.split('?')[0]);

// 検索Enter
$('#QueryInput').keypress((e) => {
  if (e.which == 13) {
    $('#SearchForm').submit();
  }
});

//// プロフィール
// プレビュー表示
$('#ProfileImageFileInput').change((e) => {
  if (imageValidate($('#ProfileImageFileInput'))) {
    let file = e.target.files[0];
    let blobUrl = window.URL.createObjectURL(file);
    let uploadPreview = $('.profileImagePreview.imagePreview');
    uploadPreview.css('background-image', `url('${blobUrl}')`);
  } 
});
$('#BackImageFileInput').change((e) => {
  if (imageValidate($('#BackImageFileInput'))) {
    let file = e.target.files[0];
    let blobUrl = window.URL.createObjectURL(file);
    let uploadPreview = $('.backImagePreview.imagePreview');
    uploadPreview.css('background-image', `url('${blobUrl}')`);
  }
});
// 更新
$('#BasicInfoSubmitBtn').on('click', () => {
  if (imageValidate($('#BackImageFileInput')) && imageValidate($('#ProfileImageFileInput'))) {
    $('#BasicInfoForm').submit();
  }
});
// 削除
$('#BasicInfoDeleteBtn').hide();

//// ハッシュタグ
// ターゲット切り替え
$('#HashTagSelection').change(() => {
  if (idx == "new") {
    $('#HashTagDeleteBtn').hide();
  } else {
    $('#HashTagDeleteBtn').show();
  }
  let idx = $('#HashTagSelection').val();
  $(`#HashTagNameForm`).val($(`.${idx}.hashTagHidden`).attr('name'));
  $(`#HashTagCommentForm`).val($(`.${idx}.hashTagHidden`).attr('comment'));
});
// 更新
$('#HashTagSubmitBtn').on('click', () => {
  $('#HashTagForm').submit();
});
// ハッシュタグ削除
$('#HashTagDeleteBtn').hide();
$('#HashTagDeleteBtn').on('click', () => {
  let form = $('#HashTagForm');
  $('#HashTagDeleted').val(1);
  form.submit();
});

//// 活動場所
// ターゲット切り替え
$('#ActivitySelection').change(() => {
  if (idx == "new") {
    $('#ActivityDeleteBtn').hide();
  } else {
    $('#ActivityDeleteBtn').show();
  }
  let idx = $('#ActivitySelection').val();
  $(`#ActivityNameForm`).val($(`.${idx}.activityHidden`).attr('name'));
  $(`#ActivityLinkForm`).val($(`.${idx}.activityHidden`).attr('link'));
});
// 更新
$('#ActivitySubmitBtn').on('click', () => {
  $('#ActivityForm').submit();
});
// 削除
$('#ActivityDeleteBtn').hide();
$('#ActivityDeleteBtn').on('click', () => {
  let form = $('#ActivityForm');
  $('#ActivityDeleted').val(1);
  form.submit();
});

//// 応援方法
// ターゲット切り替え
$('#CheeringSelection').change(() => {
  if (idx == "new") {
    $('#CheeringDeleteBtn').hide();
  } else {
    $('#CheeringDeleteBtn').show();
  }
  let idx = $('#CheeringSelection').val();
  $(`#CheeringNameForm`).val($(`.${idx}.cheeringHidden`).attr('name'));
  $(`#CheeringLinkForm`).val($(`.${idx}.cheeringHidden`).attr('link'));
});
// 更新
$('#CheeringSubmitBtn').on('click', () => {
  $('#CheeringForm').submit();
});
// 削除
$('#CheeringDeleteBtn').hide();
$('#CheeringDeleteBtn').on('click', () => {
  let form = $('#CheeringForm');
  $('#CheeringDeleted').val(1);
  form.submit();
});

//// パパ/ママ
// ターゲット切り替え
$('#ParentSelection').change(() => {
  if (idx == "new") {
    $('#ParentDeleteBtn').hide();
  } else {
    $('#ParentDeleteBtn').show();
  }
  let idx = $('#ParentSelection').val();
  $(`#ParentRelationshipForm`).val($(`.${idx}.parentHidden`).attr('relationship'));
  $(`#ParentNameForm`).val($(`.${idx}.parentHidden`).attr('name'));
  $(`#ParentLinkForm`).val($(`.${idx}.parentHidden`).attr('link'));
});
// 更新
$('#ParentSubmitBtn').on('click', () => {
  $('#ParentForm').submit();
});
// 削除
$('#ParentDeleteBtn').hide();
$('#ParentDeleteBtn').on('click', () => {
  let form = $('#ParentForm');
  $('#ParentDeleted').val(1);
  form.submit();
});

//// 立ち絵
// ターゲット切り替え
$('#TachieSelection').change(() => {
  let idx = $('#TachieSelection').val();
  // ボタン表示制御
  if (idx == "new") {
    $('#TachieDeleteBtn').hide();
  } else {
    $('#TachieDeleteBtn').show();
  }
  // プレビュー画像切り替え
  $(`.tachie.imagePreview`).hide();
  $(`.${idx}.tachie.imagePreview`).show();
  $(`.tachieNameForm`).val($(`.${idx}.tachieNameHidden`).val());
  $(`.tachieCommentForm`).val($(`.${idx}.tachieCommentHidden`).val());
  $('#TachieFileInput').val("");
  $('#ThumbnailCheckForm').hide();
});
// プレビュー表示
$('#TachieFileInput').change((e) => {
  if (imageValidate($('#TachieFileInput'))) {
    let file = e.target.files[0];
    if (!$('.tachieNameForm').val()) {
      $('.tachieNameForm').val(file.name.split('.')[0]);
    }
    let blobUrl = window.URL.createObjectURL(file);
    let uploadPreview = $('.tachie.upload.imagePreview');
    uploadPreview.css('background-image', `url('${blobUrl}')`);
    $(`.tachie.imagePreview`).hide();
    uploadPreview.show();
    $('#ThumbnailCheckForm').show();
  }
});
// 更新
$('#TachieSubmitBtn').on('click', () => {
  if (imageValidate($('#TachieFileInput'))) {
    $('#TachieForm').submit();
  }
});
// 削除
$('#TachieDeleteBtn').hide();
$('#TachieDeleteBtn').on('click', () => {
  let form = $('#TachieForm');
  $('#TachieDeleted').val(1);
  form.submit();
});

//// キャラクターデザイン
// プレビューを表示
$('#DesignFileInput').change((e) => {
  if (imageValidate($('#DesignFileInput'))) {
    let file = e.target.files[0];
    let blobUrl = window.URL.createObjectURL(file);
    let uploadPreview = $('.design.upload.imagePreview');
    uploadPreview.css('background-image', `url('${blobUrl}')`);
    $(`.design.imagePreview`).hide();
    uploadPreview.show();
  }
});
// 更新
$('#DesignSubmitBtn').on('click', () => {
  if (imageValidate($('#DesignFileInput'))) {
    $('#DesignForm').submit();
  }
});
// 削除
$('#DesignDeleteBtn').on('click', () => {
  let form = $('#DesignForm');
  $('#DesignDeleted').val(1);
  form.submit();
});

//// ロゴ
// プレビューを表示
$('#LogoFileInput').change((e) => {
  if (imageValidate($('#LogoFileInput'))) {
    let file = e.target.files[0];
    let blobUrl = window.URL.createObjectURL(file);
    let uploadPreview = $('.logo.upload.imagePreview');
    uploadPreview.css('background-image', `url('${blobUrl}')`);
    $(`.logo.imagePreview`).hide();
    uploadPreview.show();
  }
});
// 更新
$('#LogoSubmitBtn').on('click', () => {
  if (imageValidate($('#LogoFileInput'))) {
    $('#LogoForm').submit();
  }
});
// 削除
$('#LogoDeleteBtn').on('click', () => {
  let form = $('#LogoForm');
  $('#LogoDeleted').val(1);
  form.submit();
});

//// OGP
// プレビューを表示
$('#OgpFileInput').change((e) => {
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
});
// 更新
$('#OgpSubmitBtn').on('click', () => {
  if (imageValidate($('#OgpFileInput'))) {
    $('#OgpForm').submit();
  }
});
// 削除
$('#OgpDeleteBtn').on('click', () => {
  let form = $('#OgpForm');
  $('#OgpDeleted').val(1);
  form.submit();
});

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
