var log4js = require('log4js');
var url = require('url');
var request = require("request");
var logger = log4js.getLogger();
var dputil = require("./util");
var cookie = require('cookie');
var sdate = require('s-date');
var config = [];
var routes = [];
var addRoute = function(reg, val) {
  routes.push({
    'reg': reg,
    'val': val
  });
};
var addRedirect = function(reg, val) {
  config.push({
    'reg': reg,
    'val': val
  });
};
var location = function(req, res, next, url) {
  logger.info("redirect For %s, To: %s", req.url, url);
  res.writeHead(301, {
    'Location': url
  });
  res.end();
  return true;
};
var route = function(req, res, next, url) {
  logger.info("route For %s, To: %s", req.url, url);
  req.url = url;
  return hflLogin(req, res, next, 'index.html');
};

var renderRoute = function(req, res, next) {
  for (var i in routes) {
    var r = routes[i].reg,
        v = routes[i].val;
    if (!r.test(req.url)) {
      continue;
    }

    if (typeof(v) == "string") {
      return route(req, res, next, config[i].val);
    } else if (typeof(v) == 'function') {
      return v(req, res, next);
    }
  }
};
var renderRedirect = function(req, res, next) {
  for (var i in config) {
    var r = config[i].reg,
        v = config[i].val;
    if (!r.test(req.url)) {
      continue;
    }

    if (typeof(v) == "string") {
      return location(req, res, next, config[i].val);
    } else if (typeof(v) == 'function') {
      return v(req, res, next);
    }
  }
  return renderRoute(req, res, next);
};

addRoute(/\/detail.html/, function(req, res, next) {
  var paramsObj = url.parse(req.url, true).query,
      _url = '/mall/product/' + paramsObj.productId + '-' + paramsObj.goodsId + (paramsObj.freeGoodsId ? '-' + paramsObj.freeGoodsId : '') + '.html';
  res.writeHead(301, {
    "Location": _url
  });
  return res.end();
});

//积分商品
addRoute(/product\/\d+-\d+-\d+\./, function(req, res, next) {
  var result = req.url.match(/product\/(\d+)-(\d+)-(\d+)\.html/);
  if (!result) {
    logger.error("Location /product/(\d+)-(\d+)-(\d+).html for url: %s", req.url);
    return false;
  }
  //detail.html?mul=&token=&contentNo=&memberKey=&package_name=&goodsId=47799&productId=2987
  var _url = "/mall/detail.html?goodsId=" + result[2] + "&productId=" + result[1] + "&freeGoodsId=" + result[3];
  if (req.url.indexOf('?') != -1) {

    _url += "&" + url.parse(req.url).query;
  }
  return route(req, res, next, _url);
});
addRoute(/product\/\d+-\d+\./, function(req, res, next) {
  var result = req.url.match(/product\/(\d+)-(\d+)\.html/);
  if (!result) {
    logger.error("Location /product/(\d+)-(\d+).html for url: %s", req.url);
    return false;
  }
  //detail.html?mul=&token=&contentNo=&memberKey=&package_name=&goodsId=47799&productId=2987
  var _url = "/mall/detail.html?goodsId=" + result[2] + "&productId=" + result[1];
  if (req.url.indexOf('?') != -1) {

    _url += "&" + url.parse(req.url).query;
  }
  return route(req, res, next, _url);
});

module.exports = function(req, res, next) {
  if (renderRedirect(req, res, next)) {
    return false;
  } else {
    next();
  }
};
