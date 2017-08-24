define("main", ["page"], function (page) {
     var urlEvent = {
        currIndex: 0,
        init: function () {
            this.addUrl();
            this.onGlobalEventPage();
        },
        addUrl: function (url) {
            var state = {
                "title": "",
                "url": url || location.href,
                "currIndex": (++urlEvent.currIndex)
            };
            history[url ? "pushState" : "replaceState"](state, state.title, state.url);
        },
        onGlobalEventPage: function () {
            $(HYFramework.config.hybody).on("click", "a", function (e) {
                var self = $(this);
                //排除无效链接 by LiuSong on 2017/7/7.
                if (/^javascript:/.test(this.href)) {
                    return;
                }
                if (self.is('[noPage]')) {

                    // 如果a元素存在noPage属性则不执行pageIn事件
                    urlEvent.addUrl(self.attr('href'));
                    return;
                }

                e.preventDefault();
                var io = self.data('io') || 'slide';

                // HYFramework.pageIn(this.href, {io: io});
                HYFramework.pageIn(self.attr('href'), {io: io});
                // ana(token); 统计
            });
            this.writeToCookie();
            HYFramework.util.addHistroy();
        },
        writeToCookie: function () {
            // 将用户信息，来源信息保存到cookie中,保存前清空cookie
            var obj = HYFramework.util.getRequest(),
                setCookie = HYFramework.util.setCookie,
                getCookie = HYFramework.util.getCookie,
                delCookie = HYFramework.util.deleteCookie;

            var params = ['mul', 'package_name', 'memberKey', 'token', 'contentNo'];

            for (var i in params) {
                var name = params[i];
                if( name == 'token' && obj.buId )continue;
                if (obj[name]) {
                    setCookie(name, obj[name]);
                }
            }
            if (!getCookie('contentNo')) {
                setCookie('contentNo', (+new Date() + Math.floor(Math.random() * 1000)));
            }
            if (!getCookie('mul')) {
                setCookie('mul', 'wap');
            }
            if (getCookie('key')) {
                deleteCookie('key');
            }
            var token = getCookie('memberKey') || getCookie('token');
            setCookie('memberKey', token);
            setCookie('token', token);
        }
    };

    return function ($HY, prototypes) {

        $.extend($HY, {
            Page: page.page,
            urlEvent: urlEvent,
            readly: function () {
                var readlyWillView = function () {
                    urlEvent.init(); // 页面跳转
                    // ana(token); 统计
                    page.loadPage({
                        // hyjs : typeof(defaultScript) != "undefined" ? defaultScript : "",
                        scriptName: typeof(defaultScript) != "undefined" ? defaultScript : "",
                        $element: HYFramework.config.hybody + " [data-role=page]",
                        pageScriptPath: typeof(defaultModel) != "undefined" ? defaultModel : null
                    });
                };
                readlyWillView();
            },
            render: function (html, data, opts) {
                return Mustache.render(html, $.extend(data, opts));
            },
            getAllUrl: function (url) {
                if (url.indexOf("http") == 0) {
                    return url;
                }

                var pathname = window.location.pathname;
                // pathname = pathname.replace(/\/product\//,'\/');
                if (false !== url.indexOf('/mall') && pathname.indexOf('/mall') !== false) {
                    url = url.replace('/mall', '');
                }

                var _parse = pathname.split('/'), _url = null;
                if (_parse.length >= 3) {
                    _url = "/" + ( _parse[1]=='product'?'':_parse[1] ) + "/" + url;
                } else {
                    _url = "/" + url;
                }

                return window.location.origin + _url.replace(/\/\//g, '/');
                // if( _parse[3] != "" ) {
                //   return _parse[0] + '//' + _parse[2] + '/' + _parse[3] + '/' + url;
                // } else {
                //   return _parse[0] + '//' + _parse[2] + '/' + _parse[4] + '/' + url;
                // }
            },
            removeArgs: function (obj, arr) {
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] in obj) {
                        delete obj[arr[i]];
                    }
                }
            },
            pageIn: function (url, options) {
                _event_renderListener();
                options = options || {};
                if ($.isPlainObject(url)) {
                    options = url;
                    url = options.url;
                }
                if (!url) {
                    return;
                }
                options.url = $HY.getAllUrl(url);
                options.io = options.io || "slide";
                options.cb = options.cb || function (e) {
                        urlEvent.addUrl(e.url);
                    };
                var request = HYFramework.util.getRequest(options.url);
                var tOpts = $.extend({
                    // mul:readCookie('mul') || '',
                    // token:readCookie('token') || '',
                    // contentNo:readCookie('contentNo') || '',
                    // memberKey:readCookie('memberKey') || '',
                    // package_name:readCookie('package_name') || ''
                }, request);

                if (!tOpts.package_name)delete tOpts.package_name;
                var argArr = ['token', 'memberKey', 'contentNo', 'mul'];
                options.url = options.url.split("?")[0] + (!$.isEmptyObject(tOpts) ? ("?" + $.param(tOpts)) : '');

                // get cache
                if (options.cache !== false) {
                    var _key = options.url + $.param(options.data || {}),
                        _keyXhr = _key + "_xhr",
                        _data = cache.getData(_key);
                }
                log.debug('pageIn ajax url:' + options.url);
                $.ajax({
                    url: options.url,
                    cache:false,
                    data: $.param(options.data || {}),
                    success: function (data, textStatus, xhr) {
                        _callback(data, textStatus, xhr.getResponseHeader('hyjs'), xhr.getResponseHeader('scriptName'));
                    },
                    error: function () {

                    }
                });
                function _callback(data, textStatus, hyjs, scriptName) {
                    if (!data) {
                        log.error('ERROR NOT is id lt hymain');
                    }
                    page.loadPage($.extend({
                        hyjs: hyjs,
                        scriptName: scriptName,
                        $element: data
                    }, options));
                }

                return false;
            }
        }, prototypes);
    };

});
