var Resource = require('deployd/lib/resource')
  , util = require('util')
  , fs = require('fs')
  , less = require('less')
  , LessParser = less.Parser
  , path = require('path');

function Assets(name, options) {
  Resource.apply(this, arguments);  
}

util.inherits(Assets, Resource);
module.exports = Assets;

var isBinary = {
    '.jpg': true
  , '.jpeg': true
  , '.gif': true
  , '.png': true
};

Assets.prototype.handle = function (ctx, next) {
  var ext = path.extname(ctx.url)
    , file = this.options.configPath + ctx.url
    , assets = this;
    

  fs.exists(file, function (exists) {
    if(exists) {
      if(isBinary[ext]) {
        fs.createReadStream(file).pipe(ctx.res);
      } else {
        fs.readFile(file, 'utf-8', assets.render(ext, ctx));
      }
    } else {
      next();
    }
  });
}

Assets.prototype.render = function (ext, ctx) {
  var assets = this;
  
  return function (err, data) {
    switch(ext) {
      case '.less':
        var parser = new LessParser({paths: [assets.options.configPath + '/less']});
        parser.parse(data, function (err, tree) {
          if(err) return ctx.done(err);
          var result = tree.toCSS();
          assets.setHeaders(ext, result, ctx);
          ctx.res.end(result);
        });
      break;
      default:
        assets.setHeaders(ext, data, ctx);
        ctx.res.end(data);
      break;
    }
  }
}

var mime = {
    '.less': 'text/css'
  , '.js':   'application/javascript'
};

Assets.prototype.setHeaders = function (ext, data, ctx) {
  ctx.res.setHeader('Content-Type', mime[ext] || 'text/plain');
  ctx.res.setHeader('Content-Length', data.length);
}