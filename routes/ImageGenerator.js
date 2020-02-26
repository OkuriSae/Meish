'use strict';
const Jimp = require('jimp');
const Path = require('path');

const ImageGenerator = {

  getExt(mimetype) {
    switch (mimetype) {
      case "image/jpeg":
        return ".jpg";
      case "image/png":
        return ".png";
      default:
        return ".jpg";
    }
  },

  validate(source) {
    let allowFileSize = 2 * (1024 ** 2); // 2MiB
    let allowMimeTypes = ['image/png', 'image/jpeg'];
    let ext = Path.extname(source.originalname);
    
    if (source.size > allowFileSize) { throw new Error('filesize'); } 
    if (!allowMimeTypes.includes(source.mimetype)) { throw new Error('mimetype'); }
    if (!ext) { throw new Error('extension'); }
  },

  async create(source, options) {
    this.validate(source);
    let img = await Jimp.read(source.path);

    // resize | crop
    if (options.mode == 'resize') {
      let w = img.bitmap.width;
      let h = img.bitmap.height;
      if (h > options.h || w > options.w) {
        if ((w/h) > (options.w/options.h)) {
          await img.resize(options.w, Jimp.AUTO, Jimp.RESIZE_BICUBIC); // 横長
        } else {
          await img.resize(Jimp.AUTO, options.h, Jimp.RESIZE_BICUBIC); // 縦長
        }
      }

    } else if (options.mode == 'crop') {
      await img.cover(options.w, options.h);
    }

    // add watermark
    if (options.water) {
      let water_frame_w = options.w/2;
      let water_frame_h = options.h/2;
      let water = await Jimp.read('public/img/logos/meish_logo_water.png');
      let water_w = water.bitmap.width;
      let water_h = water.bitmap.height;
      if ( water_w > water_frame_w || water_h > water_frame_h ) {
        if ( (water_w/water_h) > (water_frame_w/water_frame_h) ) {
          await water.resize(water_frame_w, Jimp.AUTO); // 横長
        } else {
          await water.resize(Jimp.AUTO, water_frame_h);　// 縦長
        }
      }
      await img.composite(
        water, 
        img.bitmap.width - water.bitmap.width, 
        img.bitmap.height - water.bitmap.height, 
        { mode: Jimp.BLEND_SOURCE_OVER }
      );
    }
    
    // image write
    const mimetype = options.mimetype || source.mimetype;
    if (mimetype == "image/jpeg") {
      await img.background(0xFFFFFFFF).quality(85);
    }
    let outPath = source.path + this.getExt(mimetype);
    await img.writeAsync(outPath);
    return outPath;
  }
}

module.exports = ImageGenerator;