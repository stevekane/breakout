var browserify = require("browserify")
var to5        = require("6to5-browserify")
var path       = require('path')
var fs         = require('fs')
var fileName   = process.argv[2]
var targetPath = path.join("..", "src", fileName)
var bundlePath = path.join("public", fileName)

if (!fileName) process.exit(1)

browserify({debug: true})
  .transform(to5)
  .external("dat-gui")
  .require(require.resolve(targetPath), { entry: true })
  .bundle()
  .on('error', function (err) { console.error(err); })
  .pipe(fs.createWriteStream(bundlePath))
