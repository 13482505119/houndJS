/**
 * Created by Administrator on 2017/8/24.
 */
define("utils", [], function() {
    var me = {};

    me.getJSON = function(url, data, callback) {
        url = (/^https?:\/\//.test(url) ? '' : URL.webapi) + url;
        data = $.isPlainObject(data) ? data: {};

        console.log("Ajax Request Url: %s", url);
        //$.getJSON(url, data, callback);
        $.ajax( {
            type : 'POST',
            dataType : 'jsonp',
            jsonpCallback: 'jsonp',
            url : url,
            data : data,
            success : function(json) {
                if (json.status != 0) {
                    alert(json.msg);
                    this.error();
                    return;
                }
                if ($.isFunction(callback)) {
                    callback(json);
                }
            },
            error : function(xr, textStatus, errorThrown) {
                console.log("request API ERROR url: " + url + " param:" + $.param(data) + " status: " + textStatus + " thrown: " + errorThrown);
            }
        });
    };

    return me;
});