var es = require('event-stream');
var rs = require('replacestream');
var stream = require('stream');

var fs = require('fs');

module.exports = function(manifestPath, options) {
  if (typeof(options) == 'undefined') {
    options = {
      defaultRoot: '/images'
    };
  }
  var doReplace = function(file, callback) {
    var isStream = file.contents && typeof file.contents.on === 'function' && typeof file.contents.pipe === 'function';
    var isBuffer = file.contents instanceof Buffer;

    var manifestContents = fs.readFileSync(manifestPath);
    if (!manifestContents) {
      throw new Error('Could not read manifest: ', manifestPath);
    }
    var manifest = JSON.parse(manifestContents);


    var replaceMap = {};
    for (var original in manifest) {
        var revved = manifest[original];
        replaceMap[options.defaultRoot + '/' + original] = options.defaultRoot + revved;
    }

    if (isStream) {
      for (var search in replaceMap) {
        var replace = replaceMap[search];
        file.contents = file.contents.pipe(rs(search, replace));
      };
      return callback(null, file);
    }

    if (isBuffer) {
      var contents = String(file.contents);
      for (var search in replaceMap) {
        var replace = replaceMap[search];
        contents = contents.replace(new RegExp(search, 'g'), replace);
      };
      file.contents = new Buffer(contents);
      return callback(null, file);
    }

    callback(null, file);
  };

  return es.map(doReplace);
};
