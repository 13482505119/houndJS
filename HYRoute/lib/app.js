var express = require('express');
var url = require('url');
var fs = require('fs');
var hy = require('./util');
var route = require('./route');
var spath = require('path');
var qs = require("querystring");
var log4js = require('log4js');
var logger = log4js.getLogger();
var app = express();
var wwwroot = 'dist';

var configFile = spath.join(process.cwd(), "config/application.js");
if (fs.existsSync(configFile)) {
    logger.info('load config %s', configFile);
    require(configFile);
}
function readFile(path) {
    try {
        return fs.readFileSync(path); // 加载页面
    } catch (e) {
        //logger.error("ERROR readFileSync File: %s", path);
        return false;
    }
}

app.use(function(req, res, next) {
    req.url = req.url.replace("//", "/");
    return next();
});

//app.use(function(req, res, next) {
//    if ("/" != req.url) {
//        return next();
//    }
//
//    var platform = /(iPhone|iPod|iPad|Android)/i.test(req.headers['user-agent']);
//    res.writeHead(301, {
//        "Location": "/www/" + (platform ? "welcome_app.html" : "welcome_pc.html")
//    });
//    res.end();
//});
//app.use(function(req, res, next) {
//    if (req.url.indexOf('/install') == -1) {
//        return next();
//    }
//
//    var userAgent = req.headers['user-agent'];
//    var UIWebView = /(iPhone|iPod|iPad).*AppleWebKit/i.test(userAgent);
//    var isAndroid = userAgent.toLowerCase().indexOf("android") > -1;
//    if (UIWebView || isAndroid) {
//        if (isAndroid) {
//            if (-1 != req.url.indexOf('myapp')) {
//                res.redirect('http://a.app.qq.com/o/simple.jsp?pkgname=com.j1.healthcare.patient');
//                return;
//            }
//            if (-1 != req.url.indexOf('doctor')) {
//                res.redirect('/download/android-doctor-last.apk');
//            } else {
//                res.redirect('/download/android-patient.apk');
//            }
//        } else {
//            // res.redirect('https://itunes.apple.com/WebObjects/MZStore.woa/wa/viewSoftware?id=291586600&amp;mt=8');
//            res.redirect('https://itunes.apple.com/WebObjects/MZStore.woa/wa/viewSoftware?id=910027998&amp;mt=8');
//        }
//        return;
//    } else {
//        res.redirect('/download/android-patient.apk');
//        return;
//    }
//
//    return res.redirect('/');
//});

app.use(route);
app.use(function(req, res, next) {
    if (!hy.use(req, res, next)) return;

    var path = hy.HYFormatPath(req.url);

    //if (hy.HYIsStatic(path)) {
    //    var name = spath.extname(req.url);
    //    if (name.indexOf(".log") != -1) {
    //        // logger.debug("-------------------------------------");
    //        var a;
    //        req.addListener("data", function(postdata) {
    //            a += postdata;
    //            var b = qs.parse(a);
    //            for (var key in b) {
    //                logger.debug(b[key]);
    //            }
    //        });
    //        return res.end();
    //    }
    //    return next();
    //}
    req.setEncoding('utf8');


    // 好像后面没用到project变量
    var project = hy.HYGetProject(wwwroot, path);

    if (!hy.HYIsXHR(req)) {
        var _path = /^[A-Za-z]/.test(path.charAt(0)) ? '/' + path : path; // 路径有没有/没有就添加
        var body = readFile(wwwroot + _path);

        if (body) body = body.toString();

        //logger.info('请求的接口地址为：'+path);
        hy.renderContent(wwwroot, path, body, function(content) {
            if (content === "") {
                //res.writeHead(404, {"Content-Type" : "text/html"});
            }
            return res.end(content);
        }, false, url.parse(req.url, true).query, req, res);
    }

    if (hy.HYIsXHR(req)) { // ajax 操作, 加载不包含 body head 的html

        var body = readFile(wwwroot + '/' + path);
        hy.renderContent(wwwroot, path, body, function(content) {
            return res.end(content);
        }, true, url.parse(req.url, true).query, req, res);
    }
});

app.use(express.static(wwwroot));

var server = app.listen(global.port || 3001, function() {
    //console.log('Listening on path %s', wwwroot);
    console.log('Listening on port %d', server.address().port);
});
