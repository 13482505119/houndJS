/**
 * base module
 *
 */

require(["hound"], function() {
    //document.ready
    $(function () {

        //common header
        $.hound.loadHTML($("#header"), "header.html", function ($e) {
            $e.find('a[href="'  + location.pathname.substr(location.pathname.lastIndexOf("/") + 1) +  '"]').parent().addClass("active");
        });

        //common footer
        //$("#footer").load("footer.html");
        $.hound.loadHTML($("#footer"), "footer.html");

    });
});
