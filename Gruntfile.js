/**
 * Created by Administrator on 2017/8/17.
 */
var fs = require('fs');
var spath = require('path');
var hy = require("./HYRoute/lib/util");
var hyroute = require("./HYRoute/lib/route");
var dpformat = require("./dputil.js");

Date.prototype.Format = function(fmt) {
    var o = {
        "M+": this.getMonth() + 1,// 月份
        "D+": this.getDate(),// 日
        "h+": this.getHours(),// 小时
        "m+": this.getMinutes(),// 分
        "s+": this.getSeconds(),// 秒
        "q+": Math.floor((this.getMonth() + 3) / 3),// 季度
        "S": this.getMilliseconds()
    };
    if (/(Y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    return fmt;
};

function HYResponseHeader(rep, path, dir, project) {
    var upath = spath.basename(path, '.html');
    if (fs.existsSync(dir + project + "/scripts/" + upath + '.js')) {
        rep.setHeader('scriptName', project + "/scripts/" + upath + ".js");
    } else {
        rep.setHeader('scriptName', false);
    }
    rep.setHeader('hycss', fs.existsSync(dir + project + "/styles/" + upath + '.css'));
}

module.exports = function(grunt) {
    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);
    var serveStatic = require('serve-static');
    // Configurable paths
    var config = {
        app: 'test',
        dist: 'example',
        path: "**"
    };

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        'example',
                        'dist/*',
                        '!dist/.git*'
                    ]
                }]
            },
            server: '.tmp'
        },

        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            dist: ['src/*.js']
        },

        //include & text replace
        includereplace: {
            dist: {
                options: {
                    prefix: '@@',
                    suffix: '',
                    wwwroot: 'example',
                    globals: {
                        LOGTYPE: 'node',
                        DEBUG: 1,
                        env: 0,
                        envDevelopment: 0,
                        BUILD: new Date().getTime(),
                        HYVersion: '0'
                    },
                    includesDir: '',
                    docroot: '.'
                },
                src: 'example/*.html',
                dest: './'
            }
        },

        // Reads HTML for usemin blocks to enable smart builds that automatically
        // concat, minify and revision files. Creates configurations in memory so
        // additional tasks can operate on them
        useminPrepare: {
            options: {
                dest: 'example/**/*.html'
            },
            html: 'test/index.html'
        },
        // Performs rewrites based on rev and the useminPrepare configuration
        usemin: {
            html: ['example/**/*.html']
        },

        // The following *-min tasks produce minified files in the dist folder
        imagemin: {
            dist: {
                options:{
                    optimizationLevel: 3
                },
                files: [{
                    expand: true,
                    cwd: 'test/',
                    src: '**/*.{gif,jpeg,jpg,png}',
                    dest: 'example/'
                }]
            }
        },

        htmlmin: {
            dist: {
                options: {
                    collapseBooleanAttributes: true,
                    collapseWhitespace: true,
                    // removeAttributeQuotes: true,
                    removeCommentsFromCDATA: true,
                    removeEmptyAttributes: true,
                    // removeOptionalTags: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeComments: true,
                    processScripts: ['x-tmpl-mustache']
                },
                files: [{
                    expand: true,
                    cwd: 'example',
                    src: '**/*.html',
                    dest: 'example'
                }]
            }
        },

        concat: {
            options: {
                separator: ';',
                stripBanners: true
            },
            dist: {
                src: [
                    'bower_components/mustache.js/mustache.js',
                    'bower_components/swiper/dist/js/swiper.min.js',
                    'bower_components/sweetalert2/dist/sweetalert2.min.js',
                    'bower_components/jquery/dist/jquery.min.js',
                    'bower_components/jquery-form/dist/jquery.form.min.js',
                    'bower_components/jquery-validation/dist/jquery.validate.min.js',
                    'bower_components/jquery.cookie/jquery.cookie.js',
                    'bower_components/requirejs/require.js',
                    'src/hound.js'
                ],
                dest: 'dist/hound.js'
            }
        },

        uglify: {
            options: {
                banner: '/*!\n * <%= pkg.name %> v<%= pkg.version %> \n * Created by <%= pkg.author %> on <%= grunt.template.today("yyyy-mm-dd") %>\n */\n',
                mangle: false, //不混淆变量名
                preserveComments: 'all' //不删除注释，还可以为 false（删除全部注释），some（保留@preserve @license @cc_on等注释）
            },
            dist: {
                //files: {
                //    'dist/hound.min.js': [
                //        'bower_components/mustache.js/mustache.js',
                //        'bower_components/swiper/dist/js/swiper.min.js',
                //        'bower_components/sweetalert2/dist/sweetalert2.min.js',
                //        'bower_components/jquery/dist/jquery.min.js',
                //        'bower_components/jquery-form/dist/jquery.form.min.js',
                //        'bower_components/jquery-validation/dist/jquery.validate.min.js',
                //        'bower_components/jquery.cookie/jquery.cookie.js',
                //        'bower_components/requirejs/require.js',
                //        'src/hound.js'
                //    ]
                //}
                files: [{
                    expand: true,
                    cwd: 'dist',
                    src: ['*.js','!*.min.js'],
                    dest: 'dist',
                    ext: '.min.js',
                    extDot: 'last'
                }]
            }
        },

        sass: {
            dist: {
                options: {
                    style: 'expanded',
                    sourcemap: false
                },
                files: [{
                    expand: true,
                    cwd: 'test/scss/',
                    src: ['*.scss'],
                    dest: 'example/css/',
                    ext: '.css'
                }]
            }
        },

        // Add vendor prefixed styles
        autoprefixer: {
            options: {
                browsers: ['last 1 version']
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'example/',
                        src: '**/*.css',
                        dest: 'example/'
                    }
                ]
            }
        },

        // By default, your `index.html`'s <!-- Usemin block --> will take care of
        // minification. These next options are pre-configured if you do not wish
        // to use the Usemin blocks.
        cssmin: {
            dist: {
                files: {
                    'example/css/docs.min.css': [
                        'bower_components/bootstrap/dist/css/bootstrap.min.css',
                        'test/css/buttons.css',
                        'test/css/animate.css',
                        'test/css/bootstrap-extend.css',
                        'bower_components/sweetalert2/dist/sweetalert2.min.css',
                        'example/css/docs.css'
                    ]
                }
            }
        },

        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: 'test',
                    dest: 'example',
                    src: [
                        '**/*.{ico,png,txt,jpg,jpeg,gif}',
                        '.htaccess',
                        '**/*.html'
                    ]
                }]
            }
        },

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            scripts: {
                files: ['./src/docs.js','./src/hound.js'],
                tasks: ['concat', 'jshint', 'uglify']
            },
            sass: {
                files: ['test/scss/*.scss'],
                tasks: ['sass']
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    'index.html',
                    'style.css',
                    'js/global.min.js'
                ]
            }
        },

        // The actual grunt server settings
        connect: {
            options: {
                port: 9000,
                open: true,
                livereload: 35729,
                // Change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            livereload: {
                options: {
                    middleware: function(connect) {
                        return [
                            connect().use('/.tmp', serveStatic('./.tmp')),
                            connect().use(hyroute),
                            connect().use('/bower_components', serveStatic('./bower_components')),
                            function(req, res, next) {
                                if( !hy.use(req, res, next ) ) return;
                                var path = hy.HYFormatPath( req.url );
                                var includeConf = {
                                    dist: {
                                        options: {
                                            prefix: '@@',
                                            suffix: '',
                                            wwwroot: 'example',
                                            globals: {
                                                LOGTYPE: 'node',
                                                DEBUG: 1,
                                                env: 0,
                                                envDevelopment: 0,
                                                BUILD: new Date().getTime(),
                                                HYVersion: '0'
                                            },
                                            includesDir: '',
                                            docroot: '.'
                                        },
                                        src: 'example/*.html',
                                        dest: './'
                                    }
                                };
                                var name = spath.extname( req.url );
                                var time2 = new Date().Format("YYYY-MM-DD hh:mm:ss");
                                if (name.indexOf(".log") != -1) {
                                    console.log("-------------------------------------");
                                    var a;
                                    req.addListener("data", function(postdata) {
                                        a += postdata;
                                        var b = qs.parse(a);
                                        for(var key in b){
                                            console.log(time2 + "  " + b[key]);
                                        }
                                    });
                                    return res.end();
                                }
                                if( name == '.js' ) {
                                    if( req.url.indexOf('-server.js') == -1 ) {
                                        console.log( spath.dirname(req.url), spath.basename(req.url), req.url );
                                        var file = config.app + spath.dirname(req.url) + "/" + spath.basename(req.url);
                                        console.log(req.url);
                                        var cont = fs.readFileSync( file );
                                        return res.end( dpformat.includereaplace(grunt, includeConf, cont.toString(), config.app + '/' + spath.dirname(req.url) + "/" + spath.basename(req.url) ) );
                                    } else {
                                        var tmp = spath.basename(req.url).replace('-server.js', '').split('-').join(spath.sep);

                                        var lastIndex = tmp.lastIndexOf( spath.sep );
                                        var lastName = tmp;
                                        if( lastIndex != -1 ) {
                                            lastName = tmp.substr(tmp.lastIndexOf(spath.sep) + 1);
                                        }

                                        var name = tmp.substr(0, tmp.lastIndexOf(spath.sep)) + "/server/" + lastName + ".js";

                                        var filename = config.app + "/" +name;

                                        var cont = fs.readFileSync( filename );
                                        return res.end( dpformat.includereaplace(grunt, includeConf, cont.toString(), config.app + '/' + spath.dirname(req.url) + "/" + spath.basename(req.url) ) );
                                    }
                                }


                                if( hy.HYIsStatic(path) ) return next();

                                var path = hy.HYFormatPath( req.url );
                                var project = hy.HYGetProject( config.app, path );
                                if( !hy.HYIsXHR(req) ) {
                                    req.setEncoding('utf8');
                                    var body = fs.readFileSync( config.app + '/' + path );
                                    if( body ) body = body.toString();

                                    if( !body ) {
                                        return next();
                                    }

                                    var content = dpformat.includereaplace(grunt, includeConf, body, config.app + '/' + path );

                                    HYResponseHeader(res, path, config.app, project);
                                    hy.renderContent( config.app, path, content, function( resContent ) {

                                        var upath = spath.basename( path, '.html' );
                                        console.log('info - %s', config.app + project + "/scripts/" +upath+'.js');
                                        if(fs.existsSync(config.app + project + "/scripts/" +upath+'.js')) {
                                            var defaultScript = "var defaultScript ='" + project + "/scripts/" + upath + ".js';";
                                            var mainJs = "<script>var defaultModel = '"+project.replace('/', '')+"-"+upath+"'; "+ defaultScript +"</script>";
                                            console.log( mainJs );
                                            resContent = resContent.replace("<body>", "<body>" + mainJs);
                                        }
                                        return res.end(resContent);
                                    }, false, url.parse(req.url, true).query, req, res);

                                    return;
                                }

                                if( hy.HYIsXHR(req) ) { // ajax 操作, 加载不包含 body head 的html
                                    var body = fs.readFileSync( config.app + '/' + url.parse(path).pathname).toString();
                                    var content = dpformat.includereaplace(grunt, includeConf, body, config.app + '/' + url.parse(req.url).pathname );

                                    HYResponseHeader(res, path, config.app, project); hy.renderContent(config.app, path, content, function(resContent) {
                                        return res.end( resContent );
                                    }, true, url.parse(req.url, true).query, req, res);
                                    return;
                                }

                                return next();
                            },//indexroute
                            serveStatic(config.app)
                        ];
                    }
                }
            },
            server: {
                options: {
                    port: 9001,
                    base: './'
                }
            }
        }

    });

    grunt.registerTask('server', function (target) {
        grunt.task.run([
            'clean:server',
            'connect:livereload',
            'watch'
        ]);
    });

    // Load the plugin that provides the "uglify" task.
    //grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('build', [
        'clean:dist',
        'jshint',
        'concat',
        'uglify',
        'sass',
        'autoprefixer',
        'cssmin',
        'copy',
        'usemin',
        'includereplace',
        //'htmlmin',
        'imagemin'
    ]);

    grunt.registerTask('watchit',[
        'jshint',
        'concat',
        'uglify',
        'cssmin',
        'connect',
        'watch'
    ]);

    // Default task(s).
    grunt.registerTask('default');

};