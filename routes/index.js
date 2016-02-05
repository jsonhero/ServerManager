var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/manager', function(req, res, next) {
  res.render('manager');
});

router.get('/history', function(req, res, next) {
  res.render('history');
});

router.get('/scriptor', function(req, res, next) {
  res.render('script');
});

router.get('/status', function(req, res, next) {
  res.render('serverstatus');
});
module.exports = router;
