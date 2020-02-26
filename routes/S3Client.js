'use strict';
const fs = require('fs');
const AWS = require('aws-sdk');
const s3  = new AWS.S3();

const S3Client = {

  async put(filePath, mimeType , destPath) {
    const params = {
      Body: fs.readFileSync(filePath),
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: destPath,
      ContentType: mimeType,
      ACL: 'public-read'
    }
    console.log(`s3Put:`);
    console.log(params);
    return s3.putObject(params).promise();
  },

  async delete(key) {
    if (!key) { return; }
    key = key.split('?')[0];
    var params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key.replace(process.env.s3Path,'')
    };
    console.log(`s3Delete:`);
    console.log(params);
    return s3.deleteObject(params).promise();
  }
}

module.exports = S3Client;