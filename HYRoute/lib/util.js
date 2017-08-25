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
var webapi = 'http://localhost:9008/';


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
    if (-1 !== req.url.indexOf('/scripts/main')) {
        req.url = "/scripts/main.js";
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
    var dirName = spath.dirname(route);
    dirName = dirName == '.' ? '' : dirName;

    // 根据url地址组合项目下server 目录
    var dir = spath.resolve(wwwroot + dirName + "/server");

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
        var dir = spath.resolve(wwwroot + "/scripts/cache.js");
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
    request(options, function(error, res, chunks) {
        success(error, res, chunks);
    }).on('error', function() {
        logger.error(arguments);
        failure();
    });
}

function getMark(url) {
    url = url || "";
    return url.indexOf("?") == -1 ? "?" : "&";
}

function isIn(url, str) {
    return !(url.indexOf(str + "=") == -1);
}

function replaceWebApi(url) {
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
        var entry = data['entry']; //api 地址
        var templateId = data['hytemplate']; //模版ID
        if (!templateId) {
            next();
            return;
        }

        var host = data['host'] || webapi;
        var api;
        api = host + entry;
        var isResponse = data['content'] ? true : false;

        for (var key in params) {
            api = api.replace("{" + key + "}", (encodeURIComponent(params[key]) || "''"));
        }
        api = api.replace(/({[A-Za-z]+})+/g, "");

        if (cookie) {
            if (api.indexOf("token") == -1 && api.indexOf('?') == -1) {
                api += "?token=" + cookie;
            } else {
                api += "&token=" + cookie;
            }
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
        logger.info("Start Requesta %j", option);

        // 请求接口地址
        d_request(option, function(error, res, chunks) {
            _callback(error, res, chunks);
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
            hasToken = s.entry.indexOf('token') > -1 && !! getCookie('token', req),
            hasMemberKey = s.entry.indexOf('memberKey') > -1 && !! getCookie('memberKey', req);
        if (islogin && !(hasMemberKey || hasToken)) {
            isret = true;
        }

        entrys.push(s);
    });
    if (isret && !params.package_name) {
        //toLogin(req, dRes, '/mall/login.html?referer=' + encodeURIComponent(req.url));
        //return;
    }
    async.each(entrys, render, function(error) {
        $("script[type=x-tmpl-mustache]").each(function() {
            if ($(this).data('server') == 'yes') {
                $(this).remove();
            }
        });
        $._options.decodeEntities = false;
        addHeaderNav(req, params, $('#hymain'), $);
        var html = !isAjax ? $.html() : $('#hymain').html();
        if (error) {
            html = addApiError(error, req, html);
        }
        callback(html);
    });
}

function addSeo(req, $, data) {
    var pathname = url.parse(req.url).pathname,
        seoArr = [{
            title: 'Hound 猎狗前端框架',
            keywords: 'Hound 猎狗前端框架',
            description: 'Hound 猎狗前端框架'
        }];
    if (/\/index.html/.test(pathname) || /^\/$/.test(pathname)) {
        // 首页
        $('title').text(seoArr[0].title);
        $('meta[name=keywords]').attr('content', seoArr[0].keywords);
        $('meta[name=description]').attr('content', seoArr[0].description);
    }
}

function addApiError(error, dom) {
    dom.append("<div data-type=\"" + error.type + "\" class='api-error' style=\"display:none\" data-apiurl=\"" + error.url + "\"> " + error.html + " </div>");
}

function addHeaderNav(req, params, obj, $) {

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