var http = require('http'),
    querystring = require('querystring'),
    request = require('request'),
    fs = require('fs'),
    mime = require('mime'),
    URL = require('url');

var encodeFieldPart = function (boundary, name, value) {
   var return_part = "--" + boundary + "\r\n";
   return_part += "Content-Disposition: form-data; name=\"" + name + "\"\r\n\r\n";
   return_part += value + "\r\n";
   return return_part;
};

var encodeFilePart = function (boundary, type, name, filename) {
   var return_part = "--" + boundary + "\r\n";
   return_part += "Content-Disposition: form-data; name=\"" + name + "\"; filename=\"" + filename + "\"\r\n";
   return_part += "Content-Type: " + type + "\r\n\r\n";
   return return_part;
};


var deathbycaptcha = {

   // Get the image data from an HTTP request
   decodeUrl: function(captchaURL, loopDelay, cb) {

      var url = URL.parse(captchaURL);

      http.get({
         host: url.host,
         port: url.port,
         path: url.path
      }, function (res) {

         var imagedata = '';
         res.setEncoding('binary');
         res.on('data', function (chunk) {
            imagedata += chunk;
         });

         res.on('end', function () {
            deathbycaptcha.upload(imagedata, res.headers['content-type'], loopDelay, cb);
         });

      });

   },

   // Get the image data from a file
   decodeFile: function(filePath, loopDelay, cb) {

      var contentType = mime.lookup(filePath);

      var file_reader = fs.createReadStream(filePath, {encoding: 'binary'});
      var file_contents = '';
      file_reader.on('data', function (data) {
         file_contents += data;
      });
      file_reader.on('end', function () {
         deathbycaptcha.upload(file_contents, contentType, loopDelay, cb);
      });

   },

   // Send a captcha to deatchbycaptcha
   upload: function(binaryContents, contentType, loopDelay, cb) {

      var boundary = Math.random();

      var post_data = [];
      post_data.push(new Buffer(encodeFieldPart(boundary, 'username', deathbycaptcha.credentials.username), 'ascii'));
      post_data.push(new Buffer(encodeFieldPart(boundary, 'password', deathbycaptcha.credentials.password), 'ascii'));
      post_data.push(new Buffer(encodeFilePart(boundary, contentType, 'captchafile', 'mycaptcha.'+mime.extension(contentType) ), 'binary'));
      post_data.push(new Buffer(binaryContents, 'binary'));
      post_data.push(new Buffer("\r\n--" + boundary + "--"), 'ascii');

      var length = 0, i;
      for (i = 0; i < post_data.length; i++) {
         length += post_data[i].length;
      }

      var post_options = {
         method: 'POST',
         host: 'api.dbcapi.me',
         port: '80',
         path: '/api/captcha',
         headers : {
               'Content-Type' : 'multipart/form-data; boundary=' + boundary,
               'Content-Length' : length
         }
      };

      var post_request = http.request(post_options, function (response) {
         response.setEncoding('utf8');

         var complete = "";
         response.on('data', function (chunk) {
               complete += chunk;
         });
         response.on('end', function () {
         
            var results = querystring.parse(complete);

            if(results.error || results.is_correct !== '1') {
               cb(results, null);
               return;
            }

            // results = { status: '0', captcha: '33064108', text: '', is_correct: '1' }
            var captchaId = results.captcha;

            if(loopDelay) {
               deathbycaptcha.pollLoop(captchaId, loopDelay, cb);
            }
            else {
               cb(results);
            }

         });

      });

      for (i = 0; i < post_data.length; i++) {
         post_request.write(post_data[i]);
      }
      post_request.end();

   },

   // polling-loop to get decode results
   pollLoop: function(captchaId, loopDelay, cb) {
      
      setTimeout(function () {

         deathbycaptcha.poll(captchaId, function(err, results) {

            if (err) {
               cb(err, null);
               return;
            }

            if (results.text === "" || results.text === undefined) {
               deathbycaptcha.pollLoop(captchaId, loopDelay, cb);
            } else {
               cb(null, results);
            }

         });

      }, loopDelay);

   },

   // get results for a captcha
   poll: function(captchaId, cb) {

      var url = "http://api.dbcapi.me/api/captcha/" + captchaId;
      
      request.get(url, function (error, response, body) {
         var results = querystring.parse(body);
         cb(error,results);
      });

   },


   /**
    * TODO
    */
   report: function() {},

   credit: function(cb) {

      request.post("http://api.dbcapi.me/api/user", {
         form: deathbycaptcha.credentials
      }, function (error, response, body) {
         if(error) {
            cb(error, null);
            return;
         }
         var results = querystring.parse(body);
         if(results.error) {
            cb(results, null);
            return;
         }
         cb(error,results);
      });

   }

};


module.exports = deathbycaptcha;

