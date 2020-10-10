
# 初期設定
1. がんばって aws cli を入れます
1. がんばって heroku cli を入れます
1. `yarn install` します

## devアプリ 起動
`yarn start`

# お役立ち
## S3 の本番(meish)データをdev(meishdev)にコピー
`aws s3 sync s3://meish s3://meishdev --acl public-read`

## heroku postgreSQL の本番(COBALT)データベースをdev(SILVER)にコピー
`heroku pg:copy COBALT SILVER --app young-ridge-54750 --confirm young-ridge-54750`
