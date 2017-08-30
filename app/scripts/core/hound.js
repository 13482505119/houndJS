/*!
 * Hound v2.0
 * Created by LiuSong on 2017/3/14.
 * requires: jQuery 3+
 *           jQuery Validation Plugin
 *           jQuery Form Plugin
 *           jQuery Cookie
 *           Swiper
 *           SweetAlert
 */

define("hound", [], function () {

    var config = {
            version: "2.0",
            debug: false,
            dataType: "json",
            timeout: 45000, //ajax请求超时时间:ms
            delay: 1500, //消息提醒后延迟跳转:ms
            mobile: /^1(3[0-9]|[458][0-35-9]|7[0678])\d{8}$/,
            messages: {
                loading: "加载中……",
                timeout: "请求超时",
                fail: "服务器连接错误",
                mobile: "请输入一个有效的手机号码"
            }
        },
        hound = function () {
            $.extend(this, config);
        };

    $.extend(hound.prototype, {
        isBlank: function (obj) {
            return(!obj || $.trim(obj) === "");
        },
        //SweetAlert2
        swal: sweetAlert,
        //hound sweet alert
        hsa: function (title, text, type, timer, ok) {
            if ($.isFunction(timer)) {
                ok = timer;
                timer = null;
            }
            this.swal({
                type: type,
                title: title,
                text: text,
                timer: $.isNumeric(timer) ? parseInt(timer) : null
            }).then(function () {
                if ($.isFunction(ok)) {
                    ok();
                }
            }, function () {});
        },
        alert: function (title, text, timer) {
            //this.swal(title, text, "warning");
            this.hsa(title, text, "warning", timer);
        },
        success: function (title, text, timer) {
            this.hsa(title, text, "success", timer);
        },
        error: function (title, text, timer) {
            //this.swal(title, text, "error");
            this.hsa(title, text, "error", timer);
        },
        info: function (title, text, timer) {
            //this.swal(title, text, "info");
            this.hsa(title, text, "info", timer);
        },
        loading: function (xhr) {
            var _this = this;
            _this.swal({
                title: _this.messages.loading,
                html: '<i class="fa fa-circle-o-notch fa-spin fa-4x"></i>', //Required Font Awesome
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
                timer: _this.timeout
            }).then(
                function () {},
                function (dismiss) {
                    if (dismiss === 'timer' && xhr) {
                        xhr.abort();
                        _this.error(_this.messages.timeout);
                    }
                }
            );
        },
        redirect: function (url, delay) {
            if (this.isBlank(url)) return;

            delay = $.isNumeric(delay) ? delay : 0;
            setTimeout(function () {
                switch (url) {
                    //case null:
                    //case undefined:
                    //case "":
                    //    break;
                    case "reload":
                        window.location.reload();
                        break;
                    case "back":
                        window.history.back();
                        break;
                    case "close":
                        window.self.focus();
                        window.self.close();
                        return false;
                        //break;
                    default :
                        var a = document.createElement("a");
                        if (!a.click) {
                            location.href = url.replace(/&amp;/ig, "&");
                        } else {
                            a.href = url;
                            a.style.display = "none";
                            document.body.appendChild(a);
                            a.click();
                        }
                        break;
                }
            }, delay);
        },
        ajax: function (type, url, data, fn) {
            var _this = this;
            return $.ajax({
                type: type,
                url: url,
                data: data,
                cache: false,
                success: function (json) {
                    _this.swal.close();
                    switch (json.code) {
                        case 200:
                            if ($.isFunction(fn)) {
                                fn(json);
                            }
                            if (!_this.isBlank(json.msg)) {
                                _this.success(json.msg, "", json.timer);
                            }
                            if (!_this.isBlank(json.redirect)) {
                                _this.redirect(json.redirect, _this.isBlank(json.msg) ? 0 : _this.delay);
                            }
                            break;
                        default :
                            if (!_this.isBlank(json.msg)) {
                                _this.alert(json.msg);
                            }
                            break;
                    }
                },
                error: function () {
                    _this.error(_this.messages.fail);
                },
                dataType: _this.dataType
            });
        },
        post: function (url, data, fn) {
            var _this = this,
                xhr = _this.ajax("POST", url, data, fn);

            _this.loading(xhr);
        },
        get: function (url, data, fn) {
            var _this = this,
                xhr = _this.ajax("GET", url, data, fn);

            _this.loading(xhr);
        },
        getHTML: function (url, data, fn) {
            var _this = this;
            return $.ajax({
                url: url,
                data: data,
                success: function (html) {
                    if ($.isFunction(fn)) {
                        fn(html);
                    }
                },
                error: function () {
                    _this.error(_this.messages.fail);
                },
                dataType: "html"
            });
        },
        loadHTML: function ($e, url, data, fn) {
            var _this = this;

            if ($.isFunction(data)) {
                fn = data;
                data = {};
            }
            _this.getHTML(url, data, function (html) {
                $e.html(html);
                if ($.isFunction(fn)) {
                    fn($e);
                }
            });
        },
        getRequest: function () {
            var request = {};
            $.each(location.search.substr(1).split("&"), function (i, n) {
                var index = n.indexOf("=");
                if (index != -1) { //忽略无效参数
                    request[n.substring(0, index)] = decodeURIComponent(n.substr(index + 1));
                }
            });
            return request;
        },
        fireEvent: function (node, eventName) {
            // Make sure we use the ownerDocument from the provided node to avoid cross-window problems
            var doc,
                event;
            if (node.ownerDocument) {
                doc = node.ownerDocument;
            } else if (node.nodeType == 9){
                // the node may be the document itself, nodeType 9 = DOCUMENT_NODE
                doc = node;
            } else {
                throw new Error("Invalid node passed to fireEvent: " + node.id);
            }

            if (node.dispatchEvent) {
                // Gecko-style approach (now the standard) takes more work
                var eventClass = "";

                // Different events have different event classes.
                // If this switch statement can't map an eventName to an eventClass,
                // the event firing is going to fail.
                switch (eventName) {
                    case "click": // Dispatching of 'click' appears to not work correctly in Safari. Use 'mousedown' or 'mouseup' instead.
                    case "mousedown":
                    case "mouseup":
                        eventClass = "MouseEvents";
                        break;

                    case "focus":
                    case "change":
                    case "blur":
                    case "select":
                        eventClass = "HTMLEvents";
                        break;

                    default:
                        throw "fireEvent: Couldn't find an event class for event '" + eventName + "'.";
                        //break;
                }
                event = doc.createEvent(eventClass);

                var bubbles = eventName != "change";
                event.initEvent(eventName, bubbles, true); // All events created as bubbling and cancelable.

                event.synthetic = true; // allow detection of synthetic events
                // The second parameter says go ahead with the default action
                node.dispatchEvent(event, true);
            } else  if (node.fireEvent) {
                // IE-old school style
                event = doc.createEventObject();
                event.synthetic = true; // allow detection of synthetic events
                node.fireEvent("on" + eventName, event);
            }
        }
    });

    //jQuery Function
    $.hound = new hound();

    //common events
    var events = {
        'click': {
            post: function (element, event) {
                event.preventDefault();

                var $this = $(element),
                    url = $this.data("url"),
                    data = $.extend({}, $this.data("data"));

                $.hound.post(url, data);
            },
            toggle: function (element, event) {
                event.preventDefault();

                var $this = $(element),
                    $target = $this.children().eq($this.hasClass("toggled") ? 1 : 0),
                    url = $this.data("url") || $target.data("url"),
                    data = $.extend({}, $target.data("data"));

                $.hound.post(url, data, function () {
                    $this.toggleClass("toggled");
                });
            },
            remove: function (element, event) {
                event.preventDefault();

                var $this = $(element),
                    $target = $this.data("target") ? $this.closest($this.data("target")) : $this,
                    siblings = $target.siblings().length,
                    url = $this.data("url") || $target.parent().data("removeUrl"),
                    data = $.extend({}, $this.data("data"));

                $.hound.post(url, data, function () {
                    $target.fadeOut("fast", function () {
                        if (siblings == 0 && $target.parent().data("redirect")) {
                            $.hound.redirect($this.parent().data("redirect"));
                        } else {
                            $target.remove();
                        }
                    });
                });
            },
            redirect: function (element, event) {
                event.preventDefault();

                var url = $(element).data("url");
                if ($.hound.isBlank(url)) {
                    url = window.location.href;
                    if (url.indexOf("?") == -1) {
                        url += "?_=" + (new Date().getTime());
                    } else {
                        if (url.indexOf("_=") == -1) {
                            url += "&_=" + (new Date().getTime());
                        } else {
                            url = url.replace(/(_=)\d+/, "$1" + (new Date().getTime()));
                        }
                    }
                }

                $.hound.redirect(url);
            },
            ajaxSubmit: function (element, event) {
                event.preventDefault();

                var $this = $(element).closest("form"),
                    validate = !!$this.data("validate");

                $this.ajaxSubmit({
                    beforeSubmit: function () {//arr, $form, options
                        return validate ? $this.valid() : true;
                    },
                    //resetForm: true,
                    dataType: "json",
                    error: function () {//xhr, statusText, error, $form
                        $.hound.error($.hound.messages.fail);
                    },
                    success: function (responseText) {//responseText, statusText, xhr, $form
                        switch (responseText.code) {
                            case 200:
                                $this.resetForm();
                                if (!$.hound.isBlank(responseText.msg)) {
                                    $.hound.success(responseText.msg, "", responseText.timer);
                                }
                                break;
                            default:
                                $this.find(":password").val("");
                                if (!$.hound.isBlank(responseText.msg)) {
                                    $.hound.alert(responseText.msg);
                                }
                                break;
                        }
                        if (!$.hound.isBlank(responseText.redirect)) {
                            $.hound.redirect(responseText.redirect, $.hound.isBlank(responseText.msg) ? 0 : $.hound.delay);
                        }
                    }
                });
            },
            sendCode: function (element, event) {
                event.preventDefault();

                var $this = $(element),
                    $target = $($this.data("target")),
                    text = $this.text(),
                    url = $this.data("url"),
                    data = $.extend({}, $this.data("data"));

                if ($this.data("waiting")) {
                    return false;
                }

                if ($.hound.mobile.test($target.val())) {
                    data[$target.prop("name")] = $target.val();
                    $.hound.post(url, data, function () {
                        $this.data("waiting", true);
                        var second = 60;
                        var interval = setInterval(function () {
                            if (second == 0) {
                                clearInterval(interval);
                                $this.data("waiting", false);
                                $this.text(text);
                            } else {
                                $this.text(second + "秒后可重发");
                            }
                            second--;
                        }, 1000);
                    });
                } else {
                    $.hound.alert($.hound.messages.mobile);
                }
            },
            refreshCode: function (element, event) {
                event.preventDefault();

                var $this = $(element),
                    $target = $this.is("img") ? $this : $($this.data("target")),
                    src = $target.data("src");

                src += ((src.indexOf("?") == -1 ? "?" : "&") + Math.random());

                $target.attr("src", src);
            }
        }
    };

    $(document).ready(function () {
        //bind events
        $.each(events, function (event, methods) {
            $.each(methods, function (method, handle) {
                $(document).on(event, '[data-' + event + '="' + method + '"]', function (event) {
                    var element = this,
                        confirm = $(this).data("confirm");

                    if (undefined === confirm || 0 === confirm.length) {
                        handle(element, event);
                    } else {
                        $.hound.swal({
                            title: confirm,
                            type: "question",
                            showCancelButton: true,
                            allowOutsideClick: false /* 修复部分浏览器嵌套点击 */
                        }).then(
                            function () {
                                handle(element, event);
                            },
                            function () {}
                        );
                    }
                });
            });
        });

        //element load a url
        $('[data-load]').each(function () {
            var $this = $(this);
            $.hound.loadHTML($this, $this.data("load"), $.extend({}, $this.data("data")));
        });

        //form validate
        $('form[data-validate="true"]').each(function () {
            var $this = $(this);
            this.onreset = function () {
                $this.find('.has-feedback').removeClass('has-error has-feedback has-success');
                $this.find('.form-control-feedback, .help-block').remove();
            };
        }).validate();
    });

    //jQuery Validate Settings
    $.validator.setDefaults({
        debug: $.hound.debug,
        ignore: ".ignore",
        errorElement : 'span',
        errorClass : 'help-block',
        //onfocusout: false,
        //onkeyup: false,
        //onclick: false,
        //onsubmit: true,
        errorPlacement: function (error, $input) {
            var $formGroup = $input.closest('.form-group');
            $formGroup.find('.form-control-feedback, .help-block').remove();
            $input.filter(':visible').after('<span class="fa fa-remove form-control-feedback" aria-hidden="true"></span>');
            $formGroup.append(error);
        },
        highlight: function (element) {
            $(element).closest('.form-group').addClass('has-error has-feedback');
        },
        unhighlight: function(element) {
            var $input = $(element);
            $input.closest('.form-group').removeClass('has-error has-feedback');
            $input.next('.form-control-feedback').remove();
        },
        success: function ($label) {
            var $formGroup = $label.closest('.form-group').removeClass('has-error').addClass("has-feedback has-success"),
                $input = $formGroup.find("input, textarea");
            $formGroup.find('.form-control-feedback, .help-block').remove();
            $input.filter(':visible').after('<span class="fa fa-check form-control-feedback" aria-hidden="true"></span>');
            $label.remove();
        }
    });
    $.validator.addMethod("mobile", function (value, element) {
        return this.optional(element) || $.hound.mobile.test(value);
    }, $.hound.messages.mobile);
    $.extend($.validator.messages, {
        required: "这是必填字段",
        remote: "请修正此字段",
        email: "请输入有效的电子邮件地址",
        url: "请输入有效的网址",
        date: "请输入有效的日期",
        dateISO: "请输入有效的日期 (YYYY-MM-DD)",
        number: "请输入有效的数字",
        digits: "只能输入数字",
        creditcard: "请输入有效的信用卡号码",
        equalTo: "你的输入不相同",
        extension: "请输入有效的后缀",
        maxlength: $.validator.format( "最多可以输入 {0} 个字符" ),
        minlength: $.validator.format( "最少要输入 {0} 个字符" ),
        rangelength: $.validator.format( "请输入长度在 {0} 到 {1} 之间的字符串" ),
        range: $.validator.format( "请输入范围在 {0} 到 {1} 之间的数值" ),
        max: $.validator.format( "请输入不大于 {0} 的数值" ),
        min: $.validator.format( "请输入不小于 {0} 的数值" )
    });

    //sweetAlert Settings
    sweetAlert.setDefaults({
        confirmButtonText: '确认',
        cancelButtonText: "取消",
        width: $.hound.isBlank(window.document.documentElement.style.fontSize) ? "500px" : "5rem"
    });


    return new hound();
});

