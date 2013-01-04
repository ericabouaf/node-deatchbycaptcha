# deathbycaptcha API wrapper for Node.js

Post a captcha to the [deathbycaptcha](http://www.deathbycaptcha.com/) service, then polls until the captcha is decoded.

## Installation


    npm install deathbycaptcha2


## Usage :


Set up your credentials :

    var deathbycaptcha = require('./index.js');
    
    deathbycaptcha.credentials = {
      username: 'yourusername',
      password: 'xxxxxxxx'
    };



Decode from a url, with a 10 seconds polling interval :

    deathbycaptcha.decodeUrl(url, 10000, function(err, result) {
      console.log(result.text);
    });


or decode from a file :

    deathbycaptcha.decodeFile('modern-captcha.jpg', 10000, function(err, result) {
       console.log(result.text);
    });


get your credit balance :

    deathbycaptcha.credit( function(err, result) {
       console.log(result.balance);
    });

