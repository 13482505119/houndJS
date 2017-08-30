var HYFrameworkDefaultConfig = {
        hybody: '#hymain'
    },

    URL = {
        "webapi": "@@webapi"
    };

require.config({
    ewaitSeconds: 200,
    baseUrl: 'scripts/',
    paths: {
        main: 'main',
        core: 'core',
        page: 'page',
        hound: 'hound'
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
    return HYFramework;
});

require(['core']);
