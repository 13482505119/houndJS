define('list', ['hound', 'utils', 'pullLoad'], function(hound, utils, pullLoad) {
    return {
        pageIn: function() {
            var $pullLoad = $('.pull-wrapper'),
                myIScroll,
                url,
                data = $.extend({
                    page: 1
                }, hound.getRequest());

            if ($pullLoad.length == 1) {
                url = $pullLoad.data('url');
                myIScroll = pullLoad('.pull-wrapper', {
                    pullDownAction: function () {
                        utils.getJSON(url, data, function(json) {
                            $(myIScroll.pull.body).html(Mustache.render($('#listItem').html(), json.data));
                            myIScroll.refresh();
                        });
                    },
                    pullUpAction: function () {
                        utils.getJSON(url, data, function(json) {
                            $(myIScroll.pull.body).append(Mustache.render($('#listItem').html(), json.data));
                            myIScroll.refresh();
                        });
                    }
                });

                //console.log(myIScroll);
            }


        },
        pageOut: function() {

        },
        animateEnd: function() {

        }
    };
});
