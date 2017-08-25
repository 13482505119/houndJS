var HYFrameworkDefaultConfig = {
        hybody: '#hymain',
        anibox: '.page-swap',
        // 加载内容存放地方
        module: {
            'native': 1,
            'activity': 1,
            'mall': 1,
            'index': 1,
            'health': 1
        }
    },

    _swa = function(a) {
        var undef = "undefined";
        return a != undef;
    },
    page_listener = [],
    _event_renderListener = function() {
        for (var i in page_listener) {
            try {
                page_listener[i]();
            } catch (e) {}
        }
    },
    emptyfunc = function() {},
    _log = {},

    // 获取配置参数，如果cookie里面存在，首先从cookie中获取，否则从配置文件读取
    getAPI = function(args) {
        var getCookie = function(cName) {
            var obj = {},
                tem = [],
                cookieArr = document.cookie.split(";");
            for (var i = 0, len = cookieArr.length; i < len; i++)
                if (cookieArr[i]) {
                    tem = cookieArr[i].split("=");
                    if (!tem || !tem[0] || !tem[1]) continue;
                    if (tem[0].trim() == "key") continue;
                    obj[tem[0].trim()] = decodeURIComponent(tem[1].trim());
                }
            return obj[cName];
        };

        var cUrl = getCookie(args);

        return cUrl ? cUrl : URL[args];
    },

    URL = {
        "webapi": "@@webapi"
    },
    d_webapi = function(url) {
        var _url = forUrl(getAPI("webapi")) + (url || "");
        _log.debug(_url);
        return _url;
    },
    forUrl = function(url) {
        return url + ((url && url.lastIndexOf("/") == url.length - 1) ? "" : "/");
    },

    nativeClientInfo = function() {
        var key = "com.j1.healthcare.patient,com.hy.patient,com.j1.patient".split(","),
            url = window.location.href;

        for (var name in key) {

            if (-1 !== url.indexOf("package_name=" + key[name])) {
                return {
                    packageName: key[name]
                };
            }
        }

        return false;
    },

    isNativeClient = function() {
        // return nativeClientInfo() != false;
        return nativeClientInfo();
    },
    click = function() {
        var re = /AppleWebKit.*Mobile.*/;
        return re.test(navigator.userAgent) ? 'touchend' : 'click';
    }();
String.prototype.format = function() {
    var args = arguments;
    return this.replace(/\{(\d+)\}/g, function(m, i) {
        return args[i];
    });
};

require.config({
    ewaitSeconds: 200,
    baseUrl: 'scripts/',
    paths: {
        main: 'main',
        core: 'core',
        page: 'page'
    }
});

define("core", ['main', $('#hymainjs').data('index')], function(main, aa) {
    var HYFramework = function() {
        self.currentModule = null;
    };

    HYFramework.prototype.util = {

        getTimestamp: function() {
            return new Date().getTime();
        },
        clearHistory: function(pathname) {
            if (!pathname) {
                HYFramework.histroyArr = [];
                return;
            }

            var arr = HYFramework.histroyArr;

            for (var i in arr) {
                if (arr[i].indexOf(pathname) != -1) {
                    delete HYFramework.histroyArr[i];
                }
            }
        },
        popNavHistroy: function() {
            var arr = HYFramework.histroyArr;
            var pathname = window.location.pathname;

            for (var i in arr) {
                if (arr[i].indexOf(pathname) != -1) {
                    HYFramework.histroyArr = arr.slice(0, parseInt(i) + 1);
                    return;
                }
            }
        },
        addHistroy: function() {
            // 历史记录数组
            if (!HYFramework.histroyArr) {
                HYFramework.histroyArr = [];
            }

            var s = HYFramework.histroyArr;

            var path = window.location.pathname;

            for (var i in s) {
                if (s[i].indexOf(path) != -1) {
                    return;
                }
            }

            HYFramework.histroyArr.push(location.href);
        },

        // 获取url参数，并组装成对象返回
        getRequest: function(url) {
            var o = {},
                str = url || location.search;
            var num = str.indexOf("?");
            str = str.substr(num + 1);
            var arrtmp = str.split("&");
            for (var i = 0, name, value; i < arrtmp.length; i++) {
                num = arrtmp[i].indexOf("=");
                if (num > 0) {
                    name = arrtmp[i].substring(0, num);
                    value = arrtmp[i].substr(num + 1);
                    o[name] = decodeURIComponent(value);
                }
            }
            return o;
        },
        setCookie: function(name, value, expiresHours) {
            var cookieString = name + "=" + encodeURIComponent(value);

            //判断是否设置过期时间
            if (name.toLowerCase() == 'key') return;
            if (typeof expiresHours == 'undefined') {
                expiresHours = 24;
            }
            if (expiresHours > 0) {
                var date = new Date();
                date.setTime(date.getTime() + expiresHours * 3600 * 1000);
                cookieString = cookieString + "; path=/; expires=" + date.toGMTString();
            }

            document.cookie = cookieString;
        },
        getCookie: function(name) {
            var strCookie = document.cookie,
                arrCookie = strCookie.split("; ");
            for (var i = 0; i < arrCookie.length; i++) {
                var arr = arrCookie[i].split("=");
                if (arr[0] == name) return decodeURIComponent(arr[1]);
            }
            return "";
        },
        deleteCookie: function(name) {
            var date = new Date();
            date.setTime(date.getTime() - 10000);
            document.cookie = name + "=" + HYFramework.util.getCookie(name) + "; path=/; expires=" + date.toGMTString();
        }

    };

    HYFramework.h5testhost = ''; //我的页面测试接口地址
    HYFramework.config = HYFrameworkDefaultConfig;
    main(HYFramework, HYFramework.prototype);

    window.HYFramework = HYFramework;
    try {
        HYFramework.readly();
    } catch (e) {
        document.body.innerHTML = e.stack;
    }
    if (isNativeClient()) {
        HYFramework.iVersion = parseInt(HYFramework.util.getRequest().package_name.split('-')[1].split('.').join(''));
    }
    return HYFramework;
});

require(['core']);
