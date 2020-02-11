'use strict';
import $ from 'jquery';
//import Jimp from 'jimp';
const global = Function('return this;')();
global.jQuery = $;
//import * as Vibrant from 'node-vibrant';

const imageValidate = (fileInput, form) => {
  let img = fileInput.prop('files')[0]; 
  if (!img) { return true; }
  if (!/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/.test(img.name) || !/(jpg|jpeg|png)$/.test(img.type)) {
    alert('JPG、PNGファイルの画像を添付してください。');
    $(fileInput).val(""); 
    return false;
  } else if (2*(1024**2) < img.size) {
    alert('2MB以下の画像を添付してください。');
    $(fileInput).val(""); 
    return false;
  }
  return true;
} 
/* Jimp が容量おっきいのでいったんなし
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
$('#editLink').prop('href', location.href.split('?')[0] + "?mode=edit");
$('#viewLink').prop('href', location.href.split('?')[0]);

// 検索Enter
$('#QueryInput').keypress((e) => {
  if (e.which == 13) {
    $('#SearchForm').submit();
  }
});

// 新規追加or編集のスイッチャー
const targetSwitcher = (selection, deleteBtn, cb) => {
  $(selection).change(() => {
    let idx = $(selection).val();
    if (idx == "new") {
      $(deleteBtn).hide();
    } else {
      $(deleteBtn).show();
    }
    cb(idx);
  });
}
targetSwitcher('#HashTagSelection', '#HashTagDeleteBtn', i => {
  $(`#HashTagNameForm`).val($(`.${i}.hashTagHidden`).attr('name'));
  $(`#HashTagCommentForm`).val($(`.${i}.hashTagHidden`).attr('comment'));
});
targetSwitcher('#ActivitySelection', '#ActivityDeleteBtn', i => {
  $(`#ActivityNameForm`).val($(`.${i}.activityHidden`).attr('name'));
  $(`#ActivityLinkForm`).val($(`.${i}.activityHidden`).attr('link'));
});
targetSwitcher('#CheeringSelection', '#CheeringDeleteBtn', i => {
  $(`#CheeringNameForm`).val($(`.${i}.cheeringHidden`).attr('name'));
  $(`#CheeringLinkForm`).val($(`.${i}.cheeringHidden`).attr('link'));
});
targetSwitcher('#ParentSelection', '#ParentDeleteBtn', i => {
  $(`#ParentRelationshipForm`).val($(`.${i}.parentHidden`).attr('relationship'));
  $(`#ParentNameForm`).val($(`.${i}.parentHidden`).attr('name'));
  $(`#ParentLinkForm`).val($(`.${i}.parentHidden`).attr('link'));
});
targetSwitcher('#TachieSelection', '#TachieDeleteBtn', i => {
  $(`.tachie.imagePreview`).hide();
  $(`.${i}.tachie.imagePreview`).show();
  $(`.tachieNameForm`).val($(`.${i}.tachieNameHidden`).val());
  $(`.tachieCommentForm`).val($(`.${i}.tachieCommentHidden`).val());
  $('#TachieFileInput').val("");
  $('#ThumbnailCheckForm').hide();
});

// 画像アップロードのプレビュー表示
const setPreview = (fileInput, view, success) => {
  $(fileInput).change((e) => {
    if (imageValidate($(fileInput))) {
      let file = e.target.files[0];
      let blobUrl = window.URL.createObjectURL(file);
      $(view).css('background-image', `url('${blobUrl}')`);
      if (success) {
        success(file, $(view));
      }
    } 
  });
}
setPreview('#ProfileImageFileInput', '.profileImagePreview.imagePreview');
setPreview('#BackImageFileInput', '.backImagePreview.imagePreview');
setPreview('#TachieFileInput', '.tachie.upload.imagePreview', (file, preview) => {
  if (!$('.tachieNameForm').val()) {
    $('.tachieNameForm').val(file.name.split('.')[0]);
  }
  $(`.tachie.imagePreview`).hide();
  preview.show();
  $('#ThumbnailCheckForm').show();
});
setPreview('#DesignFileInput', '.design.upload.imagePreview', (file, preview) => {
  $(`.design.imagePreview`).hide();
  preview.show();
});
setPreview('#LogoFileInput', '.logo.upload.imagePreview', (file, preview) => {
  $(`.logo.imagePreview`).hide();
  preview.show();
});
setPreview('#OgpFileInput', '.ogp.upload.imagePreview', (file, preview) => {
  $(`.ogp.imagePreview`).hide();
  preview.show();
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
});

// 更新アクションの設定
[ { key: 'BasicInfo', images: ['BackImage', 'ProfileImage'] },
  { key: 'HashTag', images: null },
  { key: 'Activity', images: null },
  { key: 'Cheering', images: null },
  { key: 'Parent', images: null },
  { key: 'HashTag', images: null },
  { key: 'Tachie', images: ['Tachie'] },
  { key: 'Design', images: ['Design'] },
  { key: 'Movie', images: null },
  { key: 'Logo', images: ['Logo'] },
  { key: 'Ogp', images: ['Ogp'] },
].forEach( (e) => {
  $(`#${e.key}SubmitBtn`).on('click', () => {
    if (e.images) {
      let validationResults = e.images.map( img => {
        return imageValidate($(`#${img}FileInput`));
      });
      if (validationResults.includes(false)) {
        return;
      }
    }
    $(`#${e.key}Form`).submit();
    $('#loading').show();
  });
});

// 削除アクションの設定
[ { key: 'BasicInfo' , hide: true },
  { key: 'Activity' , hide: true },
  { key: 'HashTag' , hide: true },
  { key: 'Cheering' , hide: true },
  { key: 'Parent' , hide: true },
  { key: 'Tachie' , hide: true },
  { key: 'Design' , hide: false },
  { key: 'Movie' , hide: false },
  { key: 'Logo' , hide: false },
  { key: 'Ogp' , hide: false },
].forEach( (e) => {
  if (e.hide) {
    $(`#${e.key}DeleteBtn`).hide();
  }
  $(`#${e.key}DeleteBtn`).on('click', () => {
    $(`#${e.key}Deleted`).val(1);
    $(`#${e.key}Form`).submit();
    $('#loading').show();
  });
});

/* Vibrant容量おっきいのでいったんなし
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