/**
 * Created by Administrator on 2017/8/17.
 */
var fs = require('fs');
var url = require('url');
var spath = require('path');
var hy = require("./HYRoute/lib/util");
var hyroute = require("./HYRoute/lib/route");
var dpformat = require("./dputil.js");

require("./config/application.js");
var exampleIRConfig = global.IRConfig.example;

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
            dist: ['src/*.js', 'test/js/*.js']
        },

        //include & text replace
        includereplace: exampleIRConfig,

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
                }, {
                    expand: true,
                    cwd: 'test/js',
                    src: ['*.js','!*.min.js'],
                    dest: 'example/js',
                    ext: '.js',
                    extDot: 'last'
                }/*, {
                    '<%= config.dist %>/scripts/vendor.js': [
                        '<%= config.dist %>/../bower_components/mustache.js/mustache.js',
                        '<%= config.dist %>/../bower_components/swiper/dist/js/swiper.min.js',
                        '<%= config.dist %>/../bower_components/sweetalert2/dist/sweetalert2.min.js',
                        '<%= config.dist %>/../bower_components/jquery/dist/jquery.min.js',
                        '<%= config.dist %>/../bower_components/jquery-form/dist/jquery.form.min.js',
                        '<%= config.dist %>/../bower_components/jquery-validation/dist/jquery.validate.min.js',
                        '<%= config.dist %>/../bower_components/jquery.cookie/jquery.cookie.js',
                        '<%= config.dist %>/../bower_components/requirejs/require.js'
                    ],
                    '<%= config.dist %>/scripts/hybrid-main.js': [
                        '<%= config.dist %>/hound.js'
                    ],
                    '<%= config.dist %>/mall/scripts/hybrid-mall-main.js':[
                        '<%= config.app %>/js/server/{,*!/}*.js',
                        '<%= config.app %>/js/scripts/{,*!/}*.js',
                        '!<%= config.app %>/mall/scripts/testData.js',
                        '!<%= config.app %>/mall/scripts/adpage.js',
                        '!<%= config.app %>/mall/scripts/tc.js'
                    ]
                }*/]
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
                        //'**/*.js',
                        '**/*.html'
                    ]
                }]
            }
        },

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            scripts: {
                files: ['test/js/*.js'],
                tasks: ['jshint', 'concat', 'uglify']
            },
            sass: {
                files: ['test/scss/*.scss'],
                tasks: ['sass', 'autoprefixer', 'cssmin']
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    'test/**/*.html'
                ]
            }
        },

        // The actual grunt server settings
        connect: {
            options: {
                port: 9008,//9008
                open: false,
                livereload: 35728,//35729
                // Change this to '0.0.0.0' to access the server from outside
                hostname: '*'
            },
            livereload: {
                options: {
                    middleware: function(connect) {
                        return [
                            connect().use('/.tmp', serveStatic('./.tmp')),
                            connect().use('/src', serveStatic('./src')),
                            connect().use(hyroute),
                            connect().use('/bower_components', serveStatic('./bower_components')),
                            function(req, res, next) {
                                if (!hy.use(req, res, next)) return;
                                var path = hy.HYFormatPath(req.url);
                                var includeConf = exampleIRConfig.dist.options;
                                var name = spath.extname(req.url).replace(/\?.*/, '');

                                if (name == '.js') {
                                    var file = config.app + '/' + spath.dirname(req.url) + "/" + spath.basename(req.url).replace(/\?.*/, '');
                                    var cont = fs.readFileSync(file);
                                    return res.end(dpformat.includereaplace(grunt, includeConf, cont.toString(), config.app + '/' + spath.dirname(req.url) + "/" + spath.basename(req.url)));
                                }

                                if (hy.HYIsStatic(path)) return next();

                                var project = hy.HYGetProject(config.app, path);
                                var body, content;
                                if (!hy.HYIsXHR(req)) {
                                    req.setEncoding('utf8');
                                    body = fs.readFileSync(config.app + '/' + path);
                                    if (body) body = body.toString();

                                    if (!body) {
                                        return next();
                                    }

                                    content = dpformat.includereaplace(grunt, includeConf, body, config.app + '/' + path);

                                    HYResponseHeader(res, path, config.app, project);
                                    hy.renderContent(config.app, path, content, function(resContent) {

                                        var upath = spath.basename(path, '.html');
                                        console.log('info - %s', config.app + project + "/js/" + upath + '.js');
                                        if (fs.existsSync(config.app + project + "/js/" + upath + '.js')) {
                                            //var defaultScript = "var defaultScript ='" + project + "/js/" + upath + ".js';";
                                            //var mainJs = "<script>var defaultModel = '" + project.replace('/', '') + "-" + upath + "'; " + defaultScript + "</script>";
                                            var mainJs = '<script>var require = {urlArgs: "build=' + (new Date().getTime()) + '", deps: ["js/' + upath + '"]};</script>';
                                            resContent = resContent.replace("<body>", "<body>" + mainJs);
                                        }
                                        return res.end(resContent);
                                    }, false, url.parse(req.url, true).query, req, res);

                                } else {
                                    console.log('include - %s', config.app + '/' + url.parse(path).pathname);
                                    body = fs.readFileSync(config.app + '/' + url.parse(path).pathname).toString();
                                    content = dpformat.includereaplace(grunt, includeConf, body, config.app + '/' + url.parse(req.url).pathname);

                                    HYResponseHeader(res, path, config.app, project);
                                    hy.renderContent(config.app, path, content, function(resContent) {
                                        return res.end(resContent);
                                    }, true, url.parse(req.url, true).query, req, res);
                                }

                            },
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

    grunt.registerTask('server', function(target) {
        if (target === 'dist') {
            //return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

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
        'copy:dist',
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