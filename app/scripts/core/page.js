define("page", [], function() {
    var Page = function() {
        if (this.init) this.init.apply(this, arguments);
    };
    Page.prototype = {
        init: function(options) {
            this.pageScript = {};
            this.pageScriptPath = null;
            this.options = $.extend({
                io: "slide",
                hybody: "#hymain",
                cb: function() {}
            }, options);
            this.options.$element = $(options.$element || HYFramework.config.hybody + " [data-role=page]");
        },
        _goBack: function() {
            if (HYFramework.histroyArr.length == 1) {
                if (document.cookie.match(/back-url/)) {
                    var referer = (document.cookie.match(/back-url=(.*)/)[0].split(";"))[0].match(/back-url=(.*)/)[1];
                    document.cookie = "back-url=" + referer + "; path=/; expires=Sat,03 May 2000 17:44:22 GMT";
                    window.location.href = referer;
                } else {
                    window.history.back();
                }
            } else {
                HYFramework.histroyArr.pop();
                HYFramework.pageIn(HYFramework.histroyArr.pop());
            }
        },
        goBack: function() {
            var self = this;
            if (self.pageScript && self.pageScript.goBack) {
                self.pageScript.goBack(function() {
                    self._goBack();
                });
            } else {
                self._goBack();
            }
        },
        resetLoadScript: function(path) {
            this.pageScriptPath = Page.getPageScriptName(path);
        },
        loadPage: function() {
            if (this.pageScriptPath) this.loadPageScript();
            else this.loadScript();
        },
        loadScript: function() {
            var target = Page.getCurrentModule();
            if (target) target.pageOut(this);
            this.loadAnimate();
        },
        loadPageScript: function() {
            var self = this;
            require([this.pageScriptPath], function(pageModule) {
                self.pageScript = pageModule || {};
                self.loadScript();
            });
        },
        loadAnimate: function() {
            var self = this,
                p = self.options,
                isRun = false;
            var reverseClass = p.reverse ? " reverse" : "";
            var target = Page.getCurrentModule();
            if (!p.io || !target) {
                this.pageAnimateDone(); // 第一次打开页面时
                if (this.pageScript.pageIn) {
                    this.pageScript.pageIn(this);
                }
                self.noteSource();
                return;
            }
            // log.debug("动画执行开始");
            var $element = target.options.$element;
            $element.removeClass("out in reverse " + p.io);
            if ($('.pageTitle').size() > 0) {
                $('.pageTitle').remove();
            }
            $(p.hybody).append(p.$element).addClass("temOverflow");


            $element.addClass(p.io + " out" + reverseClass);
            p.$element.addClass(p.io + " in" + reverseClass);
            //setTimeout(function() { _run(); }, 1000);

            function _run(b) {
                if (isRun) {
                    return;
                }
                isRun = true;
                p.$element.unbind(b.type);
                $(p.hybody).removeClass("temOverflow");
                self.pageAnimateDone();

            }

            if (p.io == "none") {
                _run({
                    'type': ''
                });
            } else {
                // self.addRightTopNav();
                p.$element.bind("webkitAnimationEnd", _run);
                p.$element.bind("animationend", _run);
            }

            this.options.cb(this.options); // 在pageIn调用之前设置URL,pageIn会用到URL参数
            if (this.pageScript.pageIn) this.pageScript.pageIn(this);

            self.addRightTopNav();
            HYFramework.util.addHistroy();
            if (this.pageScript.isTargetNav === undefined || this.pageScript.isTargetNav) {
                HYFramework.util.popNavHistroy();
            }
        },
        noteSource: function() {
            // 记录下网页来源
            var referer = document.referrer,
                fromSite = HYFramework.util.getRequest().fromSite;
            refererPath = referer.replace(/\?.*/, '');
            if (fromSite) {
                HYFramework.util.setCookie('outsource', encodeURIComponent(fromSite));
                return;
            }
            if (refererPath && !/j1\.com/.test(refererPath)) {
                HYFramework.util.setCookie('outsource', encodeURIComponent(referer));
            }
        },
        pageOut: function() {
            var p = this.options,
                js = this.pageScript;
            if (js.pageOut) {
                js.pageOut(this); // 调页面退出事件
            }
            $('.rightNav').remove();
            p.$element.off(); // 去除页面所有事件
            // HYFramework.lastUrl = location.href;

            $("div[data-role]").each(function() { //兼容 pageIn 进入时产生的Bug
                if (!$(this).is('none')) {
                    return;
                }

                $(this).off();
                $(this).remove();
            });
            $('.rightNav').removeClass('active');
            hy.send("removeRightButtonItem");
            hy.send("removeAllView");
        },
        pageAnimateDone: function() {
            var target = Page.getCurrentModule();
            var key = "";
            var self = this;
            if (target && target.pageScript.animateEnd) {
                target.pageScript.animateEnd(this);
            }
            if (target) {
                target.dealloc(); // 删除旧的页面
            }
            Page.setCurrentModule(this); // 保存当前页面
            $('.backBtn').unbind('click').on('click', function() {
                self.goBack();
                // window.history.go(-1);
            });
        },
        dealloc: function() {
            var target = Page.getCurrentModule();
            if (target) {
                target.options.$element.remove();
            }
        }
    };

    $.extend(Page, {
        getNormalizePath: function(url) { // 获得当前标准的页面目录OR文件名
            if (!url) return "/";
            if (url[0] == '/') return url;
            var pathname = window.location.pathname;
            return pathname.substr(0, pathname.lastIndexOf('/')) + "/" + url;
        },
        getPageScriptName: function(path) { // 获得页面板块的方法名
            var module = this.getModule(path);
            path = this.getPathName(path);
            if (module == 'index') return path;
            return module + "-" + path;
        },
        getPathName: function(path) { // 获得标准的页面名称(不带扩展名)
            var pathname = path || window.location.pathname;
            if (pathname == '/') return 'index';
            pathname = pathname.substr(pathname.lastIndexOf('/') + 1);
            if (!pathname) return 'index';
            // if(pathname.indexOf('customactivity') != -1)
            // return 'customactivity';
            return pathname.replace('.html', '');
        },
        getModule: function(path) { // 获得项目名
            path = path || window.location.pathname;
            var paths = path.split('/');
            var module = 'index';
            for (var i in paths) {
                if (!paths[i]) continue;
                if (paths[i].indexOf('.html') == -1) {
                    module = paths[i];
                    break;
                }
                break;
            }
            return module;
        },
        render: function(html, data, opts) {
            return HYFramework.render(html, $.extend(data, opts));
        },
        // 模板渲染
        currentModule: null,
        getCurrentModule: function() {
            return this.currentModule;
        },
        setCurrentModule: function(l) {
            this.currentModule = l;
        },
        unreadly: function() {
            this.getCurrentModule().pageOut();
        },
        normalizePath: function(requireName) { // 获得标准的目录OR文件名
            requireName = requireName || "";
            var currentPath = window.location.pathname,
                fullpath = '',
                lastIndex = currentPath.indexOf('.html');
            if (-1 == lastIndex) {
                fullpath = currentPath[currentPath.length - 1] == '/' ? currentPath + requireName : currentPath + "/" + requireName;
            } else {
                fullpath = currentPath.substr(0, currentPath.lastIndexOf('/')) + "/" + requireName;

            }
            return fullpath;
        }
    });

    return {
        page: Page,
        loadPage: function(options) {
            var url = options.url || location.href,
                bean = new Page(options);
            if (options.hyjs && options.hyjs != "false" && require.defined(options.hyjs) || require.s.contexts._.registry[options.hyjs]) { //&& @@envDevelopment
                bean.pageScriptPath = options.hyjs;
                bean.loadPage();
            } else {
                var pathname = url.replace(/(#|\?).*/, "");
                var urlpath = Page.getNormalizePath(Page.normalizePath(pathname));
                var model = Page.getPageScriptName(urlpath);

                bean.pageScriptPath = options.pageScriptPath || model;
                bean.pageScriptPath = bean.pageScriptPath.replace(/(\w+\-)+/g, '');

                console.log('bean.pageScriptPath is:' + bean.pageScriptPath + ', options.scriptName is:' + options.scriptName);
                require([options.scriptName], function() {
                    bean.loadPage();
                });
            }
        }
    };
});