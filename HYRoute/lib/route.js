
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
  routes.push({'reg': reg, 'val': val});
};
var addRedirect = function(reg, val) {
  config.push({'reg': reg, 'val': val});
};
var location = function(req,res, next, url) {
  logger.info("redirect For %s, To: %s", req.url, url);
  res.writeHead(301, {'Location' : url});
  res.end();
  return true;
}
var route = function(req, res, next, url) {
  logger.info("route For %s, To: %s", req.url, url);
  req.url = url;
  return hflLogin(req,res,next,'index.html');
};

var renderRoute = function(req, res, next) {
  for(var i in routes) {
    var r = routes[i].reg, v = routes[i].val;
    if( !r.test(req.url) ) {
      continue;
    }

    if( typeof(v) == "string" ) {
      return route(req,res, next, config[i].val);
    } else if( typeof(v) == 'function' ) {
      return v(req,res,next);
    }
  }
};
var renderRedirect = function(req, res, next) {
  for(var i in config) {
    var r = config[i].reg, v = config[i].val;
    if( !r.test(req.url) ) {
      continue;
    }

    if( typeof(v) == "string" ) {
      return location(req,res, next, config[i].val);
    } else if( typeof(v) == 'function' ) {
      return v(req,res,next);
    }
  }
  return renderRoute(req, res, next);
};
var hflLogin = function(req,res,next,referer){
  //获取参数并转化成json格式
  var params = url.parse(req.url, true).query;
  var tmpMap = {
    '168801':{
      preUrl:'haofl/',
      outsource:'hfl'
    },
    'PKB00001':{
      preUrl:'pkb/',
      outsource:'pkb'
    },
    'SBT00001':{
      preUrl:'sbt/',
      outsource:'sbt',
      channel:'sbt'
    }
  };
  if( !params['buId']){
    return false;
  }
  //获取http接口地址
  var apiurl = dputil.replaceWebApi(req.url);
  //拼接参数
  if (tmpMap[params['buId']].channel) {
    var acty = url.parse(params['backUrl']).query;
    params['backUrl'] = 'customactivity.html?' + acty;
    apiurl+=tmpMap[params['buId']].preUrl+'login.html?buId='+params['buId']+'&userid='+params['userid']+'&name='+params['name']+'&sign='+params['sign']+'&mobile='+params['mobile'];
  }else{
    apiurl+=tmpMap[params['buId']].preUrl+'login.html?buId='+params['buId']+'&token='+params['token'];
  }
  var option = {
    url: apiurl,
    headers: {},
    timeout: 1000 * 60
  };
  if( req.headers.cookie ) {
    option.headers.cookie = req.headers.cookie;
  }
  dputil.request(option,function(error,a_res,chunks){
    if( error ) {
      console.log( error );
      next();
      return;
    }
    var html = chunks, jsonData = null, backUrl = params['backUrl'] || 'customactivityhaofuli.html';// 此处有修改需要返回customactivityhaofuli.html
    try {
      jsonData = JSON.parse( html );
    } catch( e ) {
      logger.error( e.stack );
      logger.error('url: %s \r\n html: %s', option.url, html);
      res.setHeader('API Data: ', html);
      return location(req,res,next, backUrl || '/');
    }
if( !jsonData || parseInt(jsonData.status) != 0 ) {
      logger.error('url: %s \r\n html: %s', option.url, html);
      res.setHeader('API Data: ', html);
      return location(req,res,next, (backUrl || referer) || '' );
    }

    //  var SetCookie = [
    // "token=" + jsonData.data.memberKey + "; max-age=864000",
    // "memberKey=" + jsonData.data.memberKey + "; max-age=864000",
    // "memberId="+jsonData.data.memberId + "; max-age=864000",
    // "outsource="+tmpMap[params['buId']].outsource+"; max-age=864000",
    // "is"+tmpMap[params['buId']].outsource.toUpperCase()+"=1" + "; max-age=864000"];
    var jsonDatas = jsonData.data,

    cookieArr = [
      {
        name:'token',
        value:jsonDatas.memberKey
      },
      {
        name:'memberKey',
        value:jsonDatas.memberKey
      },
      {
        name:'memberId',
        value:jsonDatas.memberId
      },
      {
        name:'outsource',
        value:tmpMap[params['buId']].outsource
      },
      {
        name:'is'+tmpMap[params['buId']].outsource.toUpperCase(),
        value:1
      }
    ];
    function setCookies(){
      for( var attr in cookieArr ){
        var item = cookieArr[attr];
          if(getCookie("isHFL",req) == 1){
               res.cookie( "isHFL","1",{expires:new Date(Date.now())} )
          }
          if(getCookie("isPKB",req) == 1){
               res.cookie( "isPKB","1",{expires:new Date(Date.now())} )
          }
          if( getCookie("isYQB",req) == 1){
              res.cookie( "isYQB","1",{expires:new Date(Date.now())} )
          }
          if( getCookie("isSBT",req) == 1){
              res.cookie( "isSBT","1",{expires:new Date(Date.now())} )
          }
          if( getCookie("isHRT",req) == 1){
              res.cookie( "isHRT","1",{expires:new Date(Date.now())} )
          }
      res.cookie( item.name,item.value,{expires:new Date(Date.now() + 24*60*60*1000)})
      }
    }
    if( referer  ) {
      setCookies();
      res.writeHead(301, {
        'Location': backUrl
      });
      return res.end();
    }

    if( backUrl ) {
      setCookies();
      res.writeHead(301, {"Location": params['backUrl']});
      return res.end();
    }

    //res.setHeader('Set-Cookie', SetCookie);
    next();
  });
  return true;
};


var yqbLogin = function(req,res,next, referer) {
  var params = url.parse(req.url, true).query;
  if( !params['uid'] || !params['loginToken'] ) {
    return false;
  }

  var apiurl = dputil.replaceWebApi(req.url);

  apiurl += "yiqianbao/loginTokenUUId.html?uid=" + params['uid'] + "&loginToken=" + params['loginToken'];

  var option = {
    url: apiurl,
    headers: {},
    timeout: 1000 * 60
  };
if( req.headers.cookie ) {
    option.headers.cookie = req.headers.cookie;
  }

  dputil.request(option, function(error, a_res, chunks) {
    if( error ) {
      console.log( error );
      next();
      return;
    }

    var html = chunks, jsonData = null, backUrl = params['backUrl'];
    try {
      jsonData = JSON.parse( html );
    } catch( e ) {
      logger.error( e.stack );
      logger.error('url: %s \r\n html: %s', option.url, html);
      res.setHeader('API Data: ', html);
      return location(req,res,next, backUrl || '/');
    }

    if( !jsonData || parseInt(jsonData.status) != 0 ) {
      logger.error('url: %s \r\n html: %s', option.url, html);
      res.setHeader('API Data: ', html);
      return location(req,res,next, (backUrl || referer) || '' );
    }


  //    var SetCookie = [
		// "yiqianbaorefreshToken="+ jsonData.data.yiqianbaorefreshToken + "; max-age=864000",
		// "yqb_uid=" + jsonData.data.yiqianbaouid + "; max-age=864000",
		// "token=" + jsonData.data.memberKey + "; max-age=864000",
		// "memberKey=" + jsonData.data.memberKey + "; max-age=864000",
		// "memberId="+jsonData.data.memberId + "; max-age=864000",
		// "isYQB=1" + "; max-age=864000"];
    var jsonDatas = jsonData.data,
    cookieArr = [
      {
        name:'yiqianbaorefreshToken',
        value:jsonDatas.yiqianbaorefreshToken
      },
      {
        name:'yqb_uid',
        value:jsonDatas.yiqianbaouid
      },
      {
        name:'outsource',
        value:'yqb'
      },
      {
        name:'isYQB',
        value:1
      },
      {
        name:'token',
        value:jsonDatas.memberKey
      },
      {
        name:'memberKey',
        value:jsonDatas.memberKey
      },
      {
        name:'memberId',
        value:jsonDatas.memberId
      }
    ];
    function setCookies(){
      for( var attr in cookieArr ){
        var item = cookieArr[attr];
          if(getCookie("isHFL",req) == 1){
              res.cookie( "isHFL","1",{expires:new Date(Date.now())} )
          }
          if(getCookie("isPKB",req) == 1){
              res.cookie( "isPKB","1",{expires:new Date(Date.now())} )
          }
          if( getCookie("isYQB",req) == 1){
              res.cookie( "isYQB","1",{expires:new Date(Date.now())} )
          }
          if( getCookie("isSBT",req) == 1){
              res.cookie( "isSBT","1",{expires:new Date(Date.now())} )
          }
          if( getCookie("isHRT",req) == 1){
              res.cookie( "isHRT","1",{expires:new Date(Date.now())} )
          }
        res.cookie( item.name,item.value,{expires:new Date(Date.now() + 24*60*60*1000)} )
      }
    }
    if( referer  ) {
      setCookies();
      res.writeHead(301, {
        // 'Location': referer + "?token=" + jsonData.data.memberKey + "&memberKey=" + jsonData.data.memberKey + "&isYQB=1&cookie="+ encodeURIComponent( JSON.stringify(SetCookie) ),
        "Location":referer
        // "Set-Cookie": SetCookie
      });

      return res.end();
    }

    if( params['backUrl'] ) {
      setCookies();
      res.writeHead(301, {
        "Location": params['backUrl']
         // 'Set-Cookie': SetCookie
      });

      return res.end();
    }

    // res.setHeader('Set-Cookie', SetCookie);
    setCookies();
    next();
  });

  return true;
};
var hrtLogin = function(req,res,next, referer) {
  var params = url.parse(req.url, true).query;
  if(!params['code']) {
    return false;
  }
  var apiurl = dputil.replaceWebApi(req.url)+"sso/hrtSsoLogin.html?code="+params['code'];
  var backUrl="index.html";
  dputil.request(apiurl,function(error,a_res,chunks){
    if(error){
        console.log(error);
    }
    var html = chunks, jsonData = null;// 此处有修改需要返回customactivityhaofuli.html
    try {
      jsonData = JSON.parse( html );
    } catch( e ) {
      logger.error( e.stack );
      logger.error('url: %s \r\n html: %s', option.url, html);
      res.setHeader('API Data: ', html);
      return location(req,res,next, referer || '/');
    }
    if( !jsonData || parseInt(jsonData.status) != 0 ) {
      res.setHeader('API Data: ', html);
      return location(req,res,next, referer|| '' );
    }
    var jsonDatas =JSON.parse( html ).data;
    var cookieArr = [
      {
        name:'token',
        value:jsonDatas.member.memberKey
      },
      {
        name:'memberKey',
        value:jsonDatas.member.memberKey
      },
      {
        name:'memberId',
        value:jsonDatas.member.memberId
      },
      {
        name:'outsource',
        value:jsonDatas.member.regType
      },
      {
        name:'isHRT',
        value:1
      }
    ];
    function setCookies(){
      for( var attr in cookieArr ){
        var item = cookieArr[attr];
        if(getCookie("isHFL",req) == 1){
          res.cookie( "isHFL","1",{expires:new Date(Date.now())} )
        }
        if(getCookie("isPKB",req) == 1){
          res.cookie( "isPKB","1",{expires:new Date(Date.now())} )
        }
        if( getCookie("isYQB",req) == 1){
          res.cookie( "isYQB","1",{expires:new Date(Date.now())} )
        }
        if( getCookie("isSBT",req) == 1){
          res.cookie( "isSBT","1",{expires:new Date(Date.now())} )
        }
        if( getCookie("isHRT",req) == 1){
          res.cookie( "isHRT","1",{expires:new Date(Date.now())} )
        }
        res.cookie( item.name,item.value,{expires:new Date(Date.now() + 24*60*60*1000)})
      }
    }
    if( referer  ) {
      setCookies();
      res.writeHead(301, {
        'Location': referer
      });
      return res.end();
    }
    setCookies();
    next();
  })
  return true;
};
function toBool(str){
  return !!str;
}

addRoute(/customactivity(.+)\.html/,function(req,res,next){

  var re = /(.*customactivity)(.+)\.html/,arr,_url;
  if( re.test( url.parse( req.url ).pathname ) ){
    arr = url.parse( req.url ).pathname.match( re );
    _url = arr[1]+'.html?activityNo'+'='+arr[2];
    if( req.url.indexOf('?') != -1 ) {

      _url += "&" + url.parse(req.url).query;
    }
    return route(req,res,next, _url);
  }

});

addRedirect(/code=/,function(req,res,next){
  //return hrtLogin(req,res,next,'index.html');
  var params = url.parse(req.url,true).query;
  console.log(params);
  if(params['orderId']){
    //
  }else if(params['mul']){
      //
  }
  else if( params["state"] && !params['urlfrom'] ){
    return hrtLogin(req,res,next,'index.html');}

});// 此段路由需注释掉
addRedirect(/index\.html/,function(req,res,next){
  return hflLogin(req,res,next,'index.html');
});// 此段路由需注释掉
addRedirect(/yiqianbao\/loginTokenUUId/, function(req,res,next) {
  return yqbLogin(req,res,next, "/");
});

addRedirect(/jsp\/1qianbao\/618\.jsp/, function(req,res,next) {
  if( /loginToken=/.test(req.url) ) {
    return yqbLogin( req,res, next, '/mall/customactivity.html?activityNo=0825');
  }
  return location(req,res,next, '/mall/customactivity.html?activityNo=0825');
});
addRedirect(/jsp\/1qianbao\/0change\.jsp/, function(req,res,next) {
  if(/loginToken=/.test(req.url) ) {
    return yqbLogin(req,res,next, "/mall/0change.html");
  }
  return location(req,res,next, "/mall/0change.html");
});
addRedirect(/jsp\/999\/999\.jsp/, function(req,res,next) {
  if(/loginToken=/.test(req.url) ) {
    yqbLogin(req,res,next, "/mall/999.html");
  }
  return location(req,res,next, "/mall/999.html");
});

addRedirect(/loginToken=/, yqbLogin);

addRedirect(/cps.html/, function(req,res,next) {
  var url_referer = req.headers['referer'];
  var CPSSource = "", linkUrl = "", cid = "", wi = "", RD = 30/** 广告期限为30天*/;

  var params = url.parse(req.url, true).query;

  CPSSource = params['union'] || CPSSource;
  linkUrl = params['linkUrl'] || linkUrl;
  cid = params['cid'] || cid;
  wi = params['wi'] || wi;
  var opts = {maxAge: 60 * 60 * 24 * RD};
  logger.info('source is：'+req.headers.referer)
  res.setHeader('Set-Cookie', [
    cookie.serialize('NewCpsSource', CPSSource, opts),
    cookie.serialize(CPSSource, JSON.stringify({'cid': cid, 'wi': wi, 'url': url_referer}), opts),
    cookie.serialize('click_time', sdate("{yyyy}-{mm}-{dd} {hh}:{Minutes}:{Seconds}"), opts),
  ]);

  return location(req,res,next, linkUrl);
});

// 亿起发
addRoute(/yqf.html/,function(req,res,next){
// http://m.j1.com/yqf.html?source=yiqifa&url=http://m.j1.com&cid=yiqifa&wi=yiqifa
  var params = url.parse(req.url,true).query,
      pubArg = {
        channel:'cps',
        cid:params.cid,
        wi:params.wi
      },
      RD = 30,
      opts = {maxAge: 60 * 60 * 24 * RD};
  res.setHeader('Set-Cookie',[
    cookie.serialize('yiqifa',JSON.stringify(pubArg),opts),
    cookie.serialize('NewCpsSource','yiqifa',opts)
  ]);

  return location(req,res,next,params.url)

});

// 成果网
addRoute(/chengguo.html/,function(req,res,next){
  // http://m.j1.com/chengguo.html?source=chanet&url=http://m.j1.com&id=123456
  var params = url.parse(req.url,true).query,
      RD = 30,
      opts = {maxAge: 60 * 60 * 24 * RD};

  res.setHeader('Set-Cookie',[
    cookie.serialize('chanetId',params.id,opts),
    cookie.serialize("NewCpsSource",'chanet',opts)
  ]);
  return location(req,res,next,params.url);
});

// 51返利
addRoute(/51fanli.html/,function(req,res,next){
  var params = url.parse(req.url,true).query,
      RD = 30,
      opts = {maxAge: 60 * 60 * 24 * RD};

  res.setHeader('Set-Cookie',[
    cookie.serialize('51fanliuid',params['u_id'],opts),
    cookie.serialize('NewCpsSource','51fanli',opts),
    cookie.serialize('trackingCode',params['tracking_code'],opts)
  ]);

  return location(req,res,next,params['target_url']);
});

// 亿起发
addRoute(/yqf.html/,function(req,res,next){
// http://m.j1.com/yqf.html?source=yiqifa&url=http://m.j1.com&cid=yiqifa&wi=yiqifa
  var params = url.parse(req.url,true).query,
      pubArg = {
        channel:'cps',
        cid:params.cid,
        wi:params.wi
      },
      RD = 30,
      opts = {maxAge: 60 * 60 * 24 * RD};
  res.setHeader('Set-Cookie',[
    cookie.serialize('yiqifa',JSON.stringify(pubArg),opts),
    cookie.serialize('NewCpsSource','yiqifa',opts)
  ]);

  return location(req,res,next,params.url)

});

// 成果网
addRoute(/chengguo.html/,function(req,res,next){
  // http://m.j1.com/chengguo.html?source=chanet&url=http://m.j1.com&id=123456
  var params = url.parse(req.url,true).query,
      RD = 30,
      opts = {maxAge: 60 * 60 * 24 * RD};

  res.setHeader('Set-Cookie',[
    cookie.serialize('chanetId',params.id,opts),
    cookie.serialize("NewCpsSource",'chanet',opts)
  ]);
  return location(req,res,next,params.url);
});

// 51返利
addRoute(/51fanli.html/,function(req,res,next){
  var params = url.parse(req.url,true).query,
      RD = 30,
      opts = {maxAge: 60 * 60 * 24 * RD};

  res.setHeader('Set-Cookie',[
    cookie.serialize('51fanliuid',params['u_id'],opts),
    cookie.serialize('NewCpsSource','51fanli',opts),
    cookie.serialize('trackingCode',params['tracking_code'],opts)
  ]);

  return location(req,res,next,params['target_url']);
});

// 领克特
addRoute(/lingkete.html/,function(req,res,next){
  var params = url.parse(req.url,true).query,
      RD = 30,
      opts = {maxAge: 60 * 60 * 24 * RD},
      LTINFO = params['a_id']+'|'+params['c_id']+'|'+params['l_id']+'|'+params['l_type1']+'|';
  if( !toBool(params['a_id']) || !toBool(params['c_id']) || !toBool(params['l_id']) || !toBool(params['m_id']) ){
    return location(req,res,next,params.url);
  }
  res.setHeader('Set-Cookie',[
    cookie.serialize('LTINFO',LTINFO,opts),
    cookie.serialize('NewCpsSource','lingkete',opts)
  ]);
  return location(req,res,next,params.url);
});

addRoute(/shopcartlist1.html/,function(req,res,next){

  // 健一医生首页顶部购物车跳转到最新h5购物车页面
  var param = req.url.substring(req.url.indexOf('?')+1);
  return location(req,res,next,'shopcart.html?'+param);
});

addRoute(/p-\d+\.html/, function(req,res,next) {
  var result = req.url.match(/p-(\d+)\.html/) ;
  if( !result ) {
    logger.error("Location p-(\d+).html for url: %s", req.url);
    return false;
  }

  var _url = "/mall/list.html?id=" + result[1];
  if( req.url.indexOf('?') != -1 ) {
    _url += "&" + url.parse(req.url).query;
  }
  return route(req,res,next, _url);
});
addRoute(/\/detail.html/,function(req,res,next){
  var paramsObj = url.parse(req.url,true).query,
  _url = '/mall/product/'+paramsObj.productId+'-'+paramsObj.goodsId+(paramsObj.freeGoodsId ? '-'+paramsObj.freeGoodsId : '') + '.html';
  res.writeHead(301, {"Location": _url});
  return res.end();
});

//积分商品
addRoute(/product\/\d+-\d+-\d+\./, function(req,res,next) {
    var result = req.url.match(/product\/(\d+)-(\d+)-(\d+)\.html/);
    if( !result ) {
        logger.error("Location /product/(\d+)-(\d+)-(\d+).html for url: %s", req.url);
        return false;
    }
    //detail.html?mul=&token=&contentNo=&memberKey=&package_name=&goodsId=47799&productId=2987
    var _url = "/mall/detail.html?goodsId=" + result[2] + "&productId=" + result[1] + "&freeGoodsId=" + result[3];
    if( req.url.indexOf('?') != -1 ) {

        _url += "&" + url.parse(req.url).query;
    }
    return route(req,res,next, _url);
});
addRoute(/product\/\d+-\d+\./, function(req,res,next) {
  var result = req.url.match(/product\/(\d+)-(\d+)\.html/);
  if( !result ) {
    logger.error("Location /product/(\d+)-(\d+).html for url: %s", req.url);
    return false;
  }
  //detail.html?mul=&token=&contentNo=&memberKey=&package_name=&goodsId=47799&productId=2987
  var _url = "/mall/detail.html?goodsId=" + result[2] + "&productId=" + result[1];
  if( req.url.indexOf('?') != -1 ) {

    _url += "&" + url.parse(req.url).query;
  }
  return route(req,res,next, _url);
});

addRoute(/\/share/, function( req, res, next ) {
  var params = url.parse(req.url, true).query;
  var _url = "/mall/detail.html?goodsId=" + params['goodsId']+ "&productId=" + params['productId'];

  return location(req, res, next, _url);
});

addRedirect(/\/activity\/d\/682.html/, "/");

module.exports = function(req,res, next) {
  if( renderRedirect(req,res,next) ) {
    return false;
  } else {
    next();
  }
};

function getCookie(key, req) {
    if (!req.headers || !req.headers.cookie) {
        return false;
    }

    var cookieString = req.headers.cookie;
    var cks = cookieString.split(";");

    var ret = {};
    for ( var k in cks) {
        var kv = cks[k].split("=");
        ret[kv[0].trim()] = kv[1];
    }

    if (!key) return ret;
    return ret[key] ? ret[key] : false;
}

