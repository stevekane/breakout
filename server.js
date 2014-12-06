var http     = require("http")
var lr       = require("livereload")
var fs       = require("fs")
var path     = require("path")
var PORT     = 4000

function writeError (res, err) {
  res.writeHead(404)
  res.end()
}

function sendFile (res, ext, data) {
  var mimeType = "text"

  if      (ext === ".js")  mimeType = "text/javascript"
  else if (ext === ".png") mimeType = "image/png"
  else if (ext === ".jpg") mimeType = "image/jpg"
  else if (ext === ".mp3") mimeType = "audio/mpeg3"
  else if (ext === ".ogg") mimeType = "audio/ogg"

  res.setHeader("Content-type", mimeType)
  res.write(data)
  res.end()
}

var routes = {
  "/draw": "./draw.html",
  "/ld":   "./ld.html"
}

var server = http.createServer(function (req, res) {
  var filePath = "." + req.url
  var fileName = path.basename(filePath)
  var fileExt  = path.extname(fileName)
  var htmlPath = routes[req.url] || "./breakout.html"

  fs.readFile(fileExt ? filePath : htmlPath, function (err, data) {
    if (err) return writeError(res, err)
    else     return sendFile(res, fileExt, data)
  })
})

var lrServer = lr.createServer()

lrServer.watch(__dirname + "/public")
server.listen(PORT)
