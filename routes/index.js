var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log('got a requestt');
  res.render('index');
});

router.get('/manager', function(req, res, next) {
  res.render('manager');
});

module.exports = router;
