/**
 * pullLoad module
 *
 * Created by LiuSong on 2017/4/25.
 */

define("pullLoad", [], function () {
    var utils = (function () {
        var me = {
            defaults: {
                pullDownAction: false,
                pullDownLock: false,
                pullDownTexts: ['下拉刷新', '松开刷新', '刷新中…'],
                pullUpAction: false,
                pullUpLock: false,
                pullUpTexts: ['上拉加载更多', '松开加载', '加载中…']
            }
        };

        me.extend = function (target, obj) {
            for ( var i in obj ) {
                target[i] = obj[i];
            }
        };

        me.createElement = function (t, c, h) {
            var o = document.createElement(t);
            if (typeof c === "string") {
                o.className = c;
            }
            if (Object.prototype.toString.call(h) === "[object Array]") {
                for (var i in h){
                    o.appendChild(h[i]);
                }
            } else if (typeof h === "object") {
                o.appendChild(h);
            } else if (typeof h === "string") {
                o.innerHTML = h;
            }

            return o;
        };

        me.hasClass = function (e, c) {
            var re = new RegExp("(^|\\s)" + c + "(\\s|$)");
            return re.test(e.className);
        };

        me.addClass = function (e, c) {
            if ( me.hasClass(e, c) ) {
                return;
            }

            var newclass = e.className.split(' ');
            newclass.push(c);
            e.className = newclass.join(' ');
        };

        me.removeClass = function (e, c) {
            if ( !me.hasClass(e, c) ) {
                return;
            }

            var re = new RegExp("(^|\\s)" + c + "(\\s|$)", 'g');
            e.className = e.className.replace(re, ' ');
        };

        me.trim = function (s) {
            return s.replace(/^\s|\s$/g, "");
        };

        me.getDomHeight = function (e) {
            var c = e.cloneNode(true);
            c.style.display = "block";
            c.style.position = "absolute";
            c.style.top = "-10000px";
            e.parentNode.appendChild(c);

            var h = c.getBoundingClientRect().height;
            e.parentNode.removeChild(c);

            return h;
        };

        return me;
    })();

    //新增锁定下拉方法
    IScroll.prototype.lockPullDown = function (lock) {
        var p = this.pull;
        if (p.down.element && p.down.lock == !lock) {
            p.down.lock = !!lock;
            if (p.down.lock) {
                p.down.element.style.display = "none";
                this.y = 0;
                this.options.startY = 0;
                p.maxScrollY = this.maxScrollY = this.maxScrollY + p.down.offset;
            } else {
                p.down.element.style.display = "block";
                this.y = -p.down.offset;
                this.options.startY = -p.down.offset;
                p.maxScrollY = this.maxScrollY = this.maxScrollY - p.down.offset;
            }
            this.refresh();
            this.scrollTo(0, this.options.startY, 300);
        }
    };
    //新增锁定上拉方法
    IScroll.prototype.lockPullUp = function (lock) {
        var p = this.pull;
        if (p.up.element && p.up.lock == !lock) {
            p.up.lock = !!lock;
            if (p.up.lock) {
                p.up.element.style.display = "none";
                p.maxScrollY = this.maxScrollY = this.maxScrollY + p.up.offset;
            } else {
                p.up.element.style.display = "block";
                p.maxScrollY = this.maxScrollY = this.maxScrollY - p.up.offset;
            }
            this.refresh();
        }
    };

    return function (e, o) {
        var _IScroll,
            options = {
                click: true,
                taps: true,
                mouseWheel: true,
                scrollbars: true,
                fadeScrollbars: true,
                probeType: 1,
                startY: 0
            },
            pull = {
                maxScrollY: 0,
                down: {},
                up: {},
                isScrolling: false,
                isLoading: false,
                flip: "pull-flip",
                loading: "pull-loading"
            },
            param = {};

        pull.wrapper = document.querySelector(e);
        if (pull.wrapper === null) {
            console.error("Not found pull element!!");
            return null;
        }
        if (utils.hasClass(pull.wrapper, "IScroll")) {
            console.error("Element has been initialized!!");
            return null;
        }

        utils.extend(param, utils.defaults);
        utils.extend(param, o);

        pull.scroller = pull.wrapper.children[0];
        pull.body = pull.scroller.children[0];
        //pull.body.style.minHeight = pull.wrapper.offsetHeight + "px";
        pull.body.style.minHeight = Math.ceil(pull.wrapper.getBoundingClientRect().height) + "px";
        pull.down.action = param.pullDownAction;
        pull.down.lock = param.pullDownLock;
        pull.down.texts = param.pullDownTexts;
        pull.down.element = utils.createElement("div", "pull-down", [pull.down.icon = utils.createElement("i", "pull-icon"), pull.down.label = utils.createElement("span", "pull-label", pull.down.texts[0])]);
        pull.scroller.insertBefore(pull.down.element, pull.body);
        pull.down.offset = utils.getDomHeight(pull.down.element);
        if (pull.down.lock) {
            options.startY = 0;
            pull.down.element.style.display = "none";
        } else {
            options.startY = -pull.down.offset;
            pull.down.element.style.display = "block";
        }
        pull.up.action = param.pullUpAction;
        pull.up.lock = param.pullUpLock;
        pull.up.texts = param.pullUpTexts;
        pull.up.element = utils.createElement("div", "pull-up", [pull.up.icon = utils.createElement("i", "pull-icon"), pull.up.label = utils.createElement("span", "pull-label", pull.up.texts[0])]);
        pull.scroller.appendChild(pull.up.element);
        pull.up.offset = utils.getDomHeight(pull.up.element);
        pull.up.element.style.display = pull.up.lock ? "none" : "block";

        //Build
        _IScroll = new IScroll(e, options);

        if (_IScroll) {
            utils.addClass(pull.wrapper, "IScroll");
        }

        if (pull.up.lock) {
            pull.maxScrollY = _IScroll.maxScrollY;
        } else {
            pull.maxScrollY = _IScroll.maxScrollY = _IScroll.maxScrollY + pull.up.offset;
        }
        _IScroll.pull = pull;

        //Event: scrollStart
        _IScroll.on("scrollStart", function () {
            var p = this.pull;
            if (this.y == this.startY) {
                p.isScrolling = true;
            }
        });

        //Event: scroll
        _IScroll.on('scroll', function () {
            var p = this.pull;
            if (p.isLoading) {
                return;
            }

            if (p.down.element && !p.down.lock) {
                if (this.y >= 5 && !utils.hasClass(p.down.element, p.flip)) {
                    utils.addClass(p.down.element, p.flip);
                    p.down.label.innerHTML = p.down.texts[1];
                } else if (this.y < 5 && utils.hasClass(p.down.element, p.flip)) {
                    utils.removeClass(p.down.element, p.flip);
                    p.down.label.innerHTML = p.down.texts[0];
                }
            }
            if (p.up.element && !p.up.lock) {
                if (this.y <= (p.maxScrollY - p.up.offset) && !utils.hasClass(p.up.element, p.flip)) {
                    utils.addClass(p.up.element, p.flip);
                    p.up.label.innerHTML = p.up.texts[1];
                    this.maxScrollY = this.maxScrollY - p.up.offset;
                } else if (this.y > (p.maxScrollY - p.up.offset) && utils.hasClass(p.up.element, p.flip)) {
                    utils.removeClass(p.up.element, p.flip);
                    p.up.label.innerHTML = p.up.texts[0];
                    this.maxScrollY = this.maxScrollY + p.up.offset;
                }
            }
            //console.log(_IScroll.maxScrollY);
        });

        //Event: scrollEnd
        _IScroll.on("scrollEnd", function () {
            var p = this.pull;
            if (p.isLoading) {
                return;
            }

            if (p.down.element && !p.down.lock) {
                if (!utils.hasClass(p.down.element, p.flip) && this.y > this.options.startY) {
                    //console.log('resume');
                    this.scrollTo(0, this.options.startY, 800);
                } else if (utils.hasClass(p.down.element, p.flip)) {
                    utils.removeClass(p.down.element, p.flip);
                    utils.addClass(p.down.element, p.loading);
                    p.down.label.innerHTML = p.down.texts[2];
                    // Execute custom function (ajax call?)
                    if (p.isScrolling) {
                        p.isLoading = true;
                        if (p.down.action) {
                            p.down.action();
                        } else {
                            this.refresh();
                        }
                    }
                }
            }
            if (p.up.element && !p.up.lock) {
                if (utils.hasClass(p.up.element, p.flip)) {
                    utils.removeClass(p.up.element, p.flip);
                    utils.addClass(p.up.element, p.loading);
                    p.up.label.innerHTML = p.up.texts[2];
                    // Execute custom function (ajax call?)
                    if (p.isScrolling) {
                        p.isLoading = true;
                        if (p.up.action) {
                            p.up.action();
                        } else {
                            this.refresh();
                        }
                    }
                }
            }

            p.isScrolling = false;
        });

        //Event: refresh
        _IScroll.on("refresh", function () {
            var p = this.pull;

            if (p.up.lock) {
                p.maxScrollY = this.maxScrollY;
            } else {
                p.maxScrollY = this.maxScrollY = this.maxScrollY + p.up.offset;
            }

            if (p.down.element && utils.hasClass(p.down.element, p.loading)) {
                utils.removeClass(p.down.element, p.loading);
                p.down.label.innerHTML = p.down.texts[0];
                this.scrollTo(0, this.options.startY, 0);
            } else if (p.up.element && utils.hasClass(p.up.element, p.loading)) {
                utils.removeClass(p.up.element, p.loading);
                p.up.label.innerHTML = p.up.texts[0];
                //this.scrollTo(0, this.maxScrollY, 0);
                this.scrollTo(0, this.y - this.wrapperHeight + p.up.offset, 0);
            }

            //p.body.style.minHeight = p.wrapper.offsetHeight + "px";
            p.body.style.minHeight = Math.ceil(p.wrapper.getBoundingClientRect().height) + "px";

            p.isLoading = false;
        });

        return _IScroll;
    };
});
