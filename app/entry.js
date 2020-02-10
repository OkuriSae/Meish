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

const setDeleteBtn = (deleteBtn, deleteHidden, deleteForm) => {
  $(deleteBtn).on('click', () => {
    $(deleteHidden).val(1);
    $(deleteForm).submit();
  });
}

// ターゲット切り替え
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

// アップロードのプレビュー表示
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

// 更新
$('#BasicInfoSubmitBtn').on('click', () => {
  if (imageValidate($('#BackImageFileInput')) && imageValidate($('#ProfileImageFileInput'))) {
    $('#BasicInfoForm').submit();
  }
});
$('#HashTagSubmitBtn').on('click', () => { $('#HashTagForm').submit(); });
$('#ActivitySubmitBtn').on('click', () => { $('#ActivityForm').submit(); });
$('#CheeringSubmitBtn').on('click', () => { $('#CheeringForm').submit(); });
$('#ParentSubmitBtn').on('click', () => {
  $('#ParentForm').submit();
});
$('#TachieSubmitBtn').on('click', () => {
  if (imageValidate($('#TachieFileInput'))) {
    $('#TachieForm').submit();
  }
});
$('#DesignSubmitBtn').on('click', () => {
  if (imageValidate($('#DesignFileInput'))) {
    $('#DesignForm').submit();
  }
});
$('#LogoSubmitBtn').on('click', () => {
  if (imageValidate($('#LogoFileInput'))) {
    $('#LogoForm').submit();
  }
});
$('#OgpSubmitBtn').on('click', () => {
  if (imageValidate($('#OgpFileInput'))) {
    $('#OgpForm').submit();
  }
});

// 削除
$('#BasicInfoDeleteBtn').hide();
$('#ActivityDeleteBtn').hide();
setDeleteBtn('#ActivityDeleteBtn', '#ActivityDeleted', '#ActivityForm');
$('#HashTagDeleteBtn').hide();
setDeleteBtn('#HashTagDeleteBtn', '#HashTagDeleted', '#HashTagForm');
$('#CheeringDeleteBtn').hide();
setDeleteBtn('#CheeringDeleteBtn', '#CheeringDeleted', '#CheeringForm');
$('#ParentDeleteBtn').hide();
setDeleteBtn('#ParentDeleteBtn', '#ParentDeleted', '#ParentForm');
$('#TachieDeleteBtn').hide();
setDeleteBtn('#TachieDeleteBtn', '#TachieDeleted', '#TachieForm');
setDeleteBtn('#DesignDeleteBtn', '#DesignDeleted', '#DesignForm');
setDeleteBtn('#LogoDeleteBtn', '#LogoDeleted', '#LogoForm');
setDeleteBtn('#OgpDeleteBtn', '#OgpDeleted', '#OgpForm');

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