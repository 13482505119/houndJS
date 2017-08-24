define('index', [], function() {
    function pageIn() {
        console.log("hello world!");
    }

    return {
        pageIn: _swa(typeof(pageIn)) ? pageIn : emptyfunc,
        pageOut: _swa(typeof(pageOut)) ? pageOut : emptyfunc,
        animateEnd: _swa(typeof(animateEnd)) ? pageOut : emptyfunc
    };
});
             