/**
 *
 * Created by fdwl on 14-8-29.
 */
var cheerio = require('cheerio');
var http = require('http');
var mustache = require('mustache');
var async = require('async');
var util = require('util');
var _ = require('lodash');
var fs = require('fs');
var url = require('url');
var spath = require('path');
var log4js = require('log4js');
var request = require("request");
var crypto = require('crypto');
var logger = log4js.getLogger();

var globalDefine = {};



function define(name, func) {
    logger.info("define %s", name);
    globalDefine[name] = func;
}

function getCookie(key, req) {
    if (!req.headers || !req.headers.cookie) {
        return false;
    }

    var cookieString = req.headers.cookie;
    var cks = cookieString.split(";");

    var ret = {};
    for (var k in cks) {
        var kv = cks[k].split("=");
        ret[kv[0].trim()] = kv[1];
    }

    if (!key) return ret;
    return ret[key] ? ret[key] : false;
}

// 如果url地址为 / 则直接跳转到 /index.html
function use(req, res, next) {
    if (-1 !== req.url.indexOf('/js/utils')) {
        req.url = "/js/utils.js";
        return true;
    }
    if (req.url == "/") {
        res.writeHead(301, {
            'Content-Type': 'text/plain;',
            'Location': '/index.html'
        });
        res.end();
        return false;
    }
    // TODO false 则截断所有请求, true 不截取
    return true;
}

function loadDefine(wwwroot, route) {
    var key = route.substr(0, route.lastIndexOf("/") + 1);
    if (key == "") key = "/";

    var bkey = route.replace(/\/\//g, '/').replace(/\//g, "-").replace("-", "").replace(".html", "-server");
    // logger.debug('key值为:'+key+';bkey值为'+bkey);
    // logger.debug("loadDefine key: ", key, " route: ", route, "mkey: ", bkey);
    // if( globalDefine[key] ) {
    //  return globalDefine[bkey];
    // }

    // 根据url地址组合项目下server 目录
    var dir = spath.resolve(wwwroot + spath.dirname(route) + "/server");

    // logger.debug("openDir: ", dir );
    var files = fs.readdirSync(dir);

    for (var file in files) {
        if (files[file] == '.' || files[file] == '..') continue;

        if (files[file].indexOf('.js') === -1) continue;
        require(spath.resolve(dir + "/" + files[file]));
    }

    globalDefine[key] = true;
    return globalDefine[bkey];
}

function loadCache(wwwroot) {
    if (!globalDefine["cache"]) {
        var dir = spath.resolve(wwwroot + "/scripts/core/cache.js");
        // logger.info("cache path:", dir);
        require(dir);
        globalDefine["cache"] = globalDefine["cache"]()
    }
    return globalDefine["cache"];
}

function d_request(options, success, failure, number) {
    number = number || 2;

    if (number <= 0) {
        return failure();
    }
    request(options, function(error, res, chunks) { //http://soa.app.j1.com/?lkafds=111&token=123123
        success(error, res, chunks);
    }).on('error', function() {
        logger.error(arguments);
        failure();
        // number -= 1;
        // setImmediate(function() {
        //  d_request(options, success, failure, number);
        // });
    });
}

function getMark(url) {
    url = url || "";
    return url.indexOf("?") == -1 ? "?" : "&";
}

function isIn(url, str) {
    return !(url.indexOf(str + "=") == -1);
};
var webapi = global.webapi || "https://soa-h5mall.j1.com/";

function replaceWebApi(url) {
    var config = global.hostconfig || {
        'https://soa-h5mall.j1.com/': [
            /[\/mall\/|\/health\/].*/,
            function(url) {},
            /\/jsp\/.*/
        ],
        'https://soa-app.j1.com/': [
            /\/native\/.*/
        ]
    };
    //var url = "http://app.j1.com/native/detail.html?12312";
    var webapi = false;
    for (var host in config) {
        if (webapi) break;

        for (var route in config[host]) {
            if (webapi) break;
            var val = config[host][route];
            var type = typeof(val);
            if (type == 'function') {
                webapi = val(url);
            } else if (type == 'object') {
                if (val.test(url)) {
                    webapi = host;
                }
            }
        }
    }

    return webapi;
}

function toLogin(req, res, loginUrl) {
    var ref = req.headers['referer'];

    // ? req.headers['referer'] : '/mall/index.html'
    ref = ref ? ref : '/mall/index.html';
    logger.debug('toLogin referer: ' + ref);
    if (false !== loginUrl.indexOf('referer')) {
        loginUrl + "?referer=" + ref;
    }
    res.writeHead(301, {
        'Location': loginUrl
    });
    res.end();
    return;
}

function toHlog(req, res, loginUrl) {
    res.writeHead(301, {
        'Location': loginUrl
    });
    res.end();
    return;
}

function renderContent(wwwroot, route, content, callback, isAjax, params, req, dRes) {
    //console.log('html：'+content);
    var md5 = crypto.createHash('md5');
    md5.update((new Date()).toString());
    var etag = md5.digest('hex');

    dRes.setHeader('Etag', etag);
    dRes.setHeader('Content-Type', 'text/html');
    dRes.setHeader('Last-Modified', _.now());
    dRes.setHeader('Cache-Control', 'max-age=0');

    params = params || {};
    //console.log('前台url地址为：'+route+'哈哈，找对了');
    var project = route.replace(/^\/\//g, "").replace(/^\//g, "").replace(/\//g, "-").replace(/\..*/, "-server"); // 获得和页面名称一样的服务JS名称
    var bkey = route.replace(/\/\//g, '/').replace(/\//g, "-").replace("-", "").replace(".html", "-server");

    // console.log( dRes._headers['hyjs'] ) ;
    if (!dRes._headers['hyjs']) {
        dRes.setHeader('hyjs', bkey.replace('-server', ""));
    }

    var $ = cheerio.load(content);

    //<div id='test' data-content="" data-isLogin="1" data-hytemplate='#hide' data-entry="indexJson.html" data-ajax='indexJson.html?id={id}'></div>
    var render = function(data, next) {
        var cookie = getCookie("token", req);
        var cookieWebapi = getCookie("webapi", req);
        if (cookieWebapi) {
            cookieWebapi = decodeURIComponent(cookieWebapi)
        }
        var entry = data['entry']; //api 地址
        var templateId = data['hytemplate']; //模版ID
        if (!templateId) {
            next();
            return;
        }

        // logger.info(cookieWebapi);
        // var host = cookieWebapi || (data['host'] || webapi);
        var host = data['host'] || replaceWebApi(route);
        // var api = host + entry;
        var api;
        var reqobj = url.parse(req.url, true).query;
        if (/orderInfo\.html/.test(req.url) && reqobj.shopcartType && reqobj.shopcartType == 2) {
            entry = entry.replace(/commit\/new_index\.html/, 'commit/abroadShopping_confirmIndex.html').replace(/addressId=0/, "addressId={addressId}");
        }
        if (/shoppingorderlist\.html/.test(req.url) && reqobj.stockId) {
            entry = entry.replace(/commit\/goodsList\.html/, 'commit/abroadGoodsList.html');
        }
        api = host + entry;
        // var api = entry.indexOf('http:') > -1?entry:(host+entry);
        var isResponse = data['content'] ? true : false;
        // logger.info("Request %s", api);

        // 从cookie中继承用户信息以及来源信息
        var reqpams = ['token', 'memberKey', 'contentNo', 'mul', 'isYQB', 'isHFL', 'isPKB', 'isSBT'];
        //logger.info("cookie===================="+getCookie("isYQB",req));
        for (var i in reqpams) {
            var name = reqpams[i];
            params[name] = params[name] || getCookie(name, req);
        }
        if (params['package_name'] && params.token && !params.memberKey) {
            params.memberKey = params.token;
        }

        /*yzx test*/
        var newapi;
        var s = "/customactivity";
        var s1 = ".html";
        if (req.url.indexOf(s) != -1) {
            var istart = req.url.indexOf(s) + s.length;
            var iend = req.url.indexOf(s1);
            var no = req.url.substring(istart, iend);
            logger.info("no:" + no);

            if (no == "" || no == null) {
                no = encodeURIComponent(params['activityNo']);
            }
            params.activityNo = no;
            //newapi = api.substr(api.indexOf("?"), api.length-1 );
            //api = "http://127.0.0.1:9000/mall/data/customactivity"+encodeURIComponent(params['activityNo'])+".json";

        }

        // params = _.extend(params,{
        //     token:getCookie('token',req) || ,
        //     memberKey:getCookie('memberKey',req),
        //     contentNo:getCookie('contentNo',req),
        //     mul:getCookie('mul',req)
        // });


        for (var key in params) {
            api = api.replace("{" + key + "}", (encodeURIComponent(params[key]) || "''"));
        }
        // logger.info('替换前api地址：'+api);
        api = api.replace(/({[A-Za-z]+})+/g, "");
        // logger.info('替换后api地址：'+api);



        if (cookie) {
            if (api.indexOf("token") == -1 && api.indexOf('?') == -1) {
                api += "?token=" + cookie;
            } else {
                api += "&token=" + cookie;
            }
        }

        if (params.token && !isIn(api, "token")) {
            api += getMark(api) + "token=" + params.token;
        }
        if (params.token && !isIn(api, "memberKey")) {
            api += getMark(api) + "memberKey=" + params.token;
        }
        if (params.memberKey && !isIn(api, "memberKey")) {
            api += getMark(api) + "memberKey=" + params.memberKey;
        }
        if (params.contentNo && !isIn(api, "contentNo")) {
            api += getMark(api) + "contentNo=" + params.contentNo;
        }
        if (params.mul && !isIn(api, "mul")) {
            api += getMark(api) + "mul=" + params.mul;
        }
        if (params.isYQB == 1 && isIn(api, "WapFastLoginType")) {
            api = api.replace(/WapFastLoginType=/, 'WapFastLoginType=yqb');
        }
        if (params.isPKB == 1 && isIn(api, "WapFastLoginType")) {
            api = api.replace(/WapFastLoginType=/, 'WapFastLoginType=pkb');
        }
        if (params.isHFL == 1 && isIn(api, "WapFastLoginType")) {
            api = api.replace(/WapFastLoginType=/, 'WapFastLoginType=hfl');
        }
        if (params.isSBT == 1 && isIn(api, "WapFastLoginType")) {
            api = api.replace(/WapFastLoginType=/, 'WapFastLoginType=sbt');
        }
        // 好福利用户购物车接口增加userType=hfl字段
        var shopcartRe = /(shopcart\.html)|(orderInfo\.html)/;
        if (shopcartRe.test(req.url) && getCookie('isHFL', req) == '1') {
            api += getMark(api) + 'userType=hfl';
        }
        var option = {
            url: api,
            headers: {},
            timeout: 1000 * 60
        };
        option.url = option.url.replace(/(memberKey|token)=false/g, function($1, $2) {
            return $2 + '=';
        });
        var globalMustacheModel = function() {
            if (!isIn(req.url, 'package_name')) {
                return {};
            }

            var key = "com.j1.healthcare.patient,com.hy.patient".split(",");
            var package_name = params.package_name;
            var result = {
                isPatient: false,
                isDoctor: false
            };

            for (var k in key) {
                if (-1 !== package_name.indexOf(key[k])) {
                    result.isPatient = true;
                }
            }

            return result;
        };

        if (req.headers.cookie) {
            option.headers.cookie = req.headers.cookie;
        }
        var _isCache = data['cache'] !== false && data['cache'] !== "false";
        if (_isCache && false) {
            var _cache = loadCache(wwwroot);
            var _chunks = _cache.getData(api);
            if (_chunks) {
                _callback(null, {}, _chunks);
                logger.info("success loading cache backstage....");
                next();
                return;
            }
        }
        logger.info("Start Requesta %j", option);

        // 请求接口地址
        d_request(option, function(error, res, chunks) {
            _callback(error, res, chunks);
            // if (_isCache) {
            //  _cache.setData(api, chunks)
            // }
            next();
        }, function() {
            logger.error(arguments);
            next();
        });

        function _callback(error, res, chunks) {
            if (error) {
                logger.error(error);
                return;
            }
            var html = chunks;

            var jsonData = null;
            try {
                jsonData = JSON.parse(html);
            } catch (e) {
                logger.error(e.stack);
                logger.error("api fatal-error url: %s html: %s", api, html);
                addApiError({
                    url: api,
                    html: html,
                    type: 'fatal-error'
                }, data.self);
                return;
            }
            //logger.info("data:", html);
            if (!jsonData || parseInt(jsonData.status) != 0) {
                logger.error("api error url: %s html: %s", api, html);
                addApiError({
                    url: api,
                    html: html,
                    type: 'error'
                }, data.self);
                return;
            }

            var $template = $(templateId);
            var model = loadDefine(wwwroot, route);

            var renderModel = jsonData.data;
            if (model) {
                try {
                    renderModel = _.extend(jsonData.data, model('server', {
                        'api': api,
                        data: renderModel,
                        aa: $
                    }, params).model);
                } catch (e) {
                    renderModel = {};
                }

            }

            var content = "";
            try {

                // 渲染html
                content = mustache.render($template.html(), _.extend(renderModel, globalMustacheModel()));
            } catch (e) {
                logger.error(e.stack);
                logger.error($template.html());
            }

            $._options.decodeEntities = false;
            data.self.html(content);
            data.self.append(util.format("<div style=\"display:none;\" data-referer=" + req.headers["referer"] + "></div>"));
            if (isResponse) {
                data.self.append(util.format("<script type=\"text\" id=\"%sContent\">%s</script>", data.self.attr("id"), html));
            }
            addSeo(req, $, jsonData.data);
            if (jsonData.data.hasOwnProperty('pageTitle')) {
                data.self.data('title', jsonData.data.pageTitle);

                $("title").text(jsonData.data.pageTitle);

                $('meta[name=description]').attr("content", jsonData.data.pageTitle);
                $('meta[name=keywords]').attr("content", jsonData.data.pageTitle);
            }
        }

    };


    var entrys = [];
    var isret = false;
    $("[data-entry]").each(function() {
        if (isret) return;

        var s = $(this).data();

        s.self = $(this);
        var islogin = s.islogin && s.islogin == '1',
            hasToken = s.entry.indexOf('token') > -1 && !!getCookie('token', req),
            // isNative = s.entry.indexOf('package_name')
            hasMemberKey = s.entry.indexOf('memberKey') > -1 && !!getCookie('memberKey', req);
        if (islogin && !(hasMemberKey || hasToken)) {
            isret = true;
        }

        entrys.push(s);
    });
    var hasloginPassWd = !!getCookie('empName', req);
    //var mobile=getCookie('mobile',req);
    var pathnamehui = url.parse(req.url).pathname;
    if (pathnamehui.indexOf('huiyuanxiangqing.html') > -1 && hasloginPassWd == false) {
        toHlog(req, dRes, "/mall/huiyuanluru.html");
    }
    if (isret && !params.package_name) {
        toLogin(req, dRes, '/mall/login.html?referer=' + encodeURIComponent(req.url));
        return;
    }
    // if( !getCookie('memberKey',req) && !params.package_name ){
    //     toLogin(req,dRes,'/mall/login.html?referer='+encodeURIComponent(req.url));
    //     return;
    // }
    async.each(entrys, render, function(error) {
        $("script[type=x-tmpl-mustache]").each(function() {
            if ($(this).data('server') == 'yes') {
                $(this).remove();
            }
        });
        $._options.decodeEntities = false;
        addHeaderNav(req, params, $('#hymain'), $);
        var html = !isAjax ? $.html() : $('#hymain').html();
        if (!isAjax) {
            html = modifyHead(html);
        }
        html = modifySearchStyle(req, html);
        html = addHealthClass(req, html, 'healthpro');
        if (error) {
            html = addApiError(error, req, html);
        }
        callback(html);
    });
}

function addSeo(req, $, data) {
    var pathname = url.parse(req.url).pathname,
        goodsName = $('.title').text(),
        seoArr = [{
            title: '网上药店-健一网,中国知名的药房网,华润集团旗下医药网,网上买药的正规药店网',
            keywords: '健一网,网上药店,药房网,药品网,医药网',
            description: '健一网手机版,专业的医药网上药店!要买药,就来j1.com!健一网上药店,中国知名的药房网,华润集团旗下医药网,提供各种药品在线销售,正品安全放心,支持货到付款,买药品正规的药店网。'
        }, {
            title: goodsName + '价格_说明书_作用_效果好不好_健一网手机版',
            keywords: goodsName + '价格,' + goodsName + '说明书, ' + goodsName + '作用',
            description: '健一网网上药店为您提供' + goodsName + '价格, ' + goodsName + '说明书, ' + goodsName + '作用,' + goodsName + '效果好不好等信息,购买' + goodsName + '就到药监局认证的健一网网上药店'
        }];
    if (/\/index.html/.test(pathname) || /^\/$/.test(pathname)) {
        // 首页
        $('title').text(seoArr[0].title);
        $('meta[name=keywords]').attr('content', seoArr[0].keywords);
        $('meta[name=description]').attr('content', seoArr[0].description);
    }
    if (/\/detail.html/.test(pathname)) {
        // 详情
        $('title').text(seoArr[1].title);
        $('meta[name=keywords]').attr('content', seoArr[1].keywords);
        $('meta[name=description]').attr('content', seoArr[1].description);
    }
}

function addApiError(error, dom) {
    dom.append("<div data-type=\"" + error.type + "\" class='api-error' style=\"display:none\" data-apiurl=\"" + error.url + "\"> " + error.html + " </div>");
}

function addHealthClass(req, str, className) {
    var request = url.parse(req.url, true).query,
        forgetArr = ['/mall/forgetpwd.html', '/mall/validate_account.html', '/mall/setnewpassword.html', '/forgetpwd.html', '/validate_account.html', '/setnewpassword.html'],
        pathname = url.parse(req.url, true).pathname,
        isForget = false,
        cookieHasHealth = req.headers.cookie && req.headers.cookie.indexOf('appsource=health') > -1;

    for (var i = 0; i < forgetArr.length; i++) {
        if (pathname == forgetArr[i]) {
            isForget = true;
            break;
        }
    }
    if ((request.appsource && request.appsource == 'health') || cookieHasHealth && isForget) {
        // str = str.replace(/id=\"hymain\"/,'id="hymain" class="'+className+'"');
        str = str.replace('id="hymain"', 'id="hymain" class="' + className + '"');
    }
    return str;

}

function modifyHead(content) {
    var $ = cheerio.load(content);

    var dataProps = $(".page-head").data();

    if (!dataProps || !dataProps['title']) return content;

    $._options.decodeEntities = false;
    $('head > title').html(dataProps.title);
    return $.html();
}

function modifySearchStyle(req, html) {
    var url = req.url;
    if (url.indexOf('search.html') > -1 && url.indexOf('package_name') > -1) {
        html = html.replace('class="fixedHeader"', 'class="fixedHeader top0"');
    }
    return html;
}

function addHeaderNav(req, params, obj, $) {
    var ref = req.headers['referer'],
        page = $('[data-role=page]', obj),
        title = page.data('title') ? page.data('title') : '暂无标题',
        isNavPage = true,
        pathname = url.parse(req.url).pathname,
        re = /\/detail.html/,
        navArr = ['catalog.html', 'shopcart.html', 'mine.html'];

    if (params.package_name || (req.headers && req.headers.cookie && req.headers.cookie.indexOf('package_name') > -1)) return;
    if (pathname == "/mall//" || pathname.match(/catalog.html/) || pathname.match(/search.html/) || pathname.match(/advise.html/) || pathname == '/mall/' || pathname == '/' || pathname.indexOf('index.html') > -1 || pathname.indexOf('sgift.html') > -1 || pathname.indexOf('huiyuanluru.html') > -1 || pathname.indexOf('huiyuanxiangqing.html') > -1 || pathname.indexOf('mine.html') > -1) return; // 首页不加头部
    $('[data-role=page]', obj).addClass('top50');
    $('.pageTitle').remove();
    for (var i = 0; i < navArr.length; i++) {
        if (pathname.indexOf(navArr[i]) > -1) {
            isNavPage = false;
            break;
        }
    }
    if (re.test(pathname)) {
        // 详情页
        var $head = $('<div>').addClass('pageTitle'),
            $nav = $('<div>').addClass('nav1');
        // arr = ['商品','详情','评价'];

        // for( var i = 0; i < arr.length; i++ ){
        //     var $span = $('<span>');
        //     if( i == 0 ){
        //         $span.addClass('on');
        //     }
        //     $span.text( arr[i] );
        //     $nav.append( $span );
        // }
        $head.append($nav);
        if (ref) {
            $head.prepend($('<span>').addClass('backBtn'));
        }
        obj.append($head);

    } else {

        if (ref) {
            obj.append($('<div class="pageTitle">' + (isNavPage ? '<span class="backBtn"></span>' : '') + '<div class="titleWrap">' + title + '</div></div>'));
        } else {
            obj.append($('<div class="pageTitle"><div class="titleWrap">' + title + '</div></div>'));
        }
    }


}
// 是不是ajax请求 根据请求头是否包含x-requested-with属性并且该属性值为XMLHttpRequest
function HYIsXHR(req) {
    return (req && req['headers'] && req.headers['x-requested-with'] && (req.headers['x-requested-with'] == 'XMLHttpRequest'));
}

// 根据路径名是否包含.html 判断是不是静态资源（图片，css，js,log等）
function HYIsStatic(path) {
    return -1 == path.indexOf('.html');
}

function HYFormatPath(path) {
    if (!path) return 'index.html';
    if (path.indexOf("?") != -1) {
        path = path.substr(0, path.indexOf('?'));
    }
    if (path == '') return 'index.html';
    if (path == '/') return 'index.html';
    if (path == '/index.html') return 'index.html';

    var extname = spath.extname(path);
    if (extname == "") return spath.join(path, 'index.html');

    // 只有文件名等于activity 并且后缀名是html，请求css js 不作处理
    // if(path.indexOf('/customactivity') != -1  && path.indexOf('.html') != -1){
    //     return '/mall/customactivity.html';
    // }

    return path;
}

// 获得项目名称
function HYGetProject(dir, path) {
    var project = "";
    var paths = path.split('/');
    for (var i in paths) {
        if (paths[i] == "") continue;
        if (paths[i].indexOf('.html') != -1) break;

        project = "/" + paths[i];
    }

    return project;
}

global.define = define;
exports.HYFormatPath = HYFormatPath;
exports.HYGetProject = HYGetProject;
exports.HYIsStatic = HYIsStatic;
exports.HYIsXHR = HYIsXHR;
exports.renderContent = renderContent;
exports.loadDefine = loadDefine;
exports.define = define;
exports.use = use;
exports.replaceWebApi = replaceWebApi;
exports.request = d_request;
global.use = use;
