/**
 * Created by Administrator on 2017/8/17.
 */
var fs = require('fs');
var url = require('url');
var spath = require('path');
var hy = require('./HYRoute/lib/util');
var hyroute = require('./HYRoute/lib/route');
var dpformat = require('./dputil.js');

require('./config/application.js');
var exampleIRConfig = global.IRConfig.example;

function HYResponseHeader(rep, path, dir, project) {
    var upath = spath.basename(path, '.html');
    if (fs.existsSync(dir + project + '/scripts/' + upath + '.js')) {
        rep.setHeader('scriptName', project + '/scripts/' + upath + '.js');
    } else {
        rep.setHeader('scriptName', false);
    }
    //rep.setHeader('hycss', fs.existsSync(dir + project + "/css/" + upath + '.css'));
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
        config: config,

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= config.dist %>/*',
                        '!<%= config.dist %>/.git*'
                    ]
                }]
            },
            server: '.tmp'
        },

        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            //options: {
            //    jshintrc: '.jshintrc',
            //    reporter: require('jshint-stylish')
            //},
            dist: [
                'scripts/*.js',
                '<%= config.app %>/scripts/*.js',
                '<%= config.app %>/server/*.js'
            ]
        },

        //include & text replace
        includereplace: exampleIRConfig,

        // Reads HTML for usemin blocks to enable smart builds that automatically
        // concat, minify and revision files. Creates configurations in memory so
        // additional tasks can operate on them
        useminPrepare: {
            options: {
                dest: '<%= config.dist %>'
            },
            html: '<%= config.app %>/index.html'
        },
        // Performs rewrites based on rev and the useminPrepare configuration
        usemin: {
            html: ['<%= config.dist %>/**/*.html']
        },

        // The following *-min tasks produce minified files in the dist folder
        imagemin: {
            dist: {
                options:{
                    optimizationLevel: 3
                },
                files: [{
                    expand: true,
                    cwd: '<%= config.app %>/',
                    src: '**/*.{gif,jpeg,jpg,png}',
                    dest: '<%= config.dist %>/'
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
                    cwd: '<%= config.dist %>',
                    src: '<%= config.path %>/*.html',
                    dest: '<%= config.dist %>'
                }]
            }
        },

        uglify: {
            options: {
                banner: '/*!\n * <%= pkg.name %> v<%= pkg.version %> \n * Created by <%= pkg.author %> on <%= grunt.template.today("yyyy-mm-dd") %>\n */\n',
                mangle: false, //不混淆变量名
                preserveComments: 'all' //不删除注释，还可以为 false（删除全部注释），some（保留@preserve @license @cc_on等注释）
            },
            dist: {
                files: [
                    {
                        '<%= config.dist %>/scripts/vendor.js': [
                            'bower_components/mustache.js/mustache.js',
                            'bower_components/swiper/dist/js/swiper.min.js',
                            'bower_components/sweetalert2/dist/sweetalert2.min.js',
                            'bower_components/jquery/dist/jquery.min.js',
                            'bower_components/jquery-form/dist/jquery.form.min.js',
                            'bower_components/jquery-validation/dist/jquery.validate.min.js',
                            'bower_components/jquery.cookie/jquery.cookie.js',
                            'bower_components/requirejs/require.js'
                        ],
                        '<%= config.dist %>/scripts/main.js': [
                            'scripts/hound.js',
                            'scripts/page.js',
                            'scripts/main.js',
                            'scripts/core.js',
                            'scripts/utils.js'
                        ],
                        '<%= config.dist %>/scripts/page.js':[
                            'test/scripts/*.js'
                        ]
                    }
                ]
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
                    cwd: '<%= config.app %>/scss/',
                    src: ['*.scss'],
                    dest: '<%= config.app %>/styles/',
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
                        cwd: '<%= config.dist %>/',
                        src: '**/*.css',
                        dest: '<%= config.dist %>/'
                    }
                ]
            },
            server: {
                files: [
                    {
                        expand: true,
                        cwd: '.tmp/',
                        src: '**/*.css',
                        dest: '.tmp/'
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
                    '<%= config.dist %>/styles/page.css': [
                        'bower_components/bootstrap/dist/css/bootstrap.css',
                        'bower_components/font-awesome/css/font-awesome.css',
                        'bower_components/sweetalert2/dist/sweetalert2.css',
                        '<%= config.app %>/styles/buttons.css',
                        '<%= config.app %>/styles/animate.css',
                        '<%= config.app %>/styles/bootstrap-extend.css',
                        '<%= config.app %>/styles/docs.css'
                    ]
                }
            }
        },

        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= config.app %>',
                        dest: '<%= config.dist %>',
                        src: [
                            '**/*.{ico,png,txt,jpg,jpeg,gif}',
                            '.htaccess',
                            '**/*.html'
                        ]
                    },
                    {
                        expand: true,
                        dot: true,
                        cwd: 'bower_components/font-awesome/fonts',
                        dest: '<%= config.dist %>/styles/fonts',
                        src: [
                            '*'
                        ]
                    }
                ]
            },
            styles: {
                expand: true,
                dot: true,
                cwd: '<%= config.app %>/',
                dest: '.tmp/',
                src: 'styles/*.css'
            }
        },

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            scripts: {
                files: ['<%= config.app %>/scripts/*.js', 'scripts/*.js'],
                tasks: ['jshint'],
                options: {
                    livereload: true
                }
            },
            sass: {
                files: ['<%= config.app %>/scss/*.scss'],
                tasks: ['sass:server', 'autoprefixer']
            },
            styles: {
                files: ['<%= config.app %>/css/*.css'],
                tasks: ['newer:copy:styles', 'autoprefixer']
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    '<%= config.app %>/**/*.html',
                    '.tmp/styles/**/{,*/}*.css'
                ]
            }
        },

        // The actual grunt server settings
        connect: {
            options: {
                port: 9008,//9000
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
                            connect().use('/scripts', serveStatic('./scripts')),
                            connect().use(hyroute),
                            connect().use('/bower_components', serveStatic('./bower_components')),
                            function(req, res, next) {
                                if (!hy.use(req, res, next)) return;
                                var path = hy.HYFormatPath(req.url);
                                var includeConf = exampleIRConfig.dist.options;
                                var name = spath.extname(req.url).replace(/\?.*/, '');
                                //console.log(req.url);
                                if (name == '.js') {
                                    var file = config.app + '/' + spath.dirname(req.url) + "/" + spath.basename(req.url).replace(/\?.*/, '');
                                    console.log(config.app, spath.dirname(req.url), spath.basename(req.url).replace(/\?.*/, ''));
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
                                        console.log('info - %s', config.app + project + "/scripts/" + upath + '.js');
                                        if (fs.existsSync(config.app + project + "/scripts/" + upath + '.js')) {
                                            //var mainJs = '<script>var require = {urlArgs: "build=' + (new Date().getTime()) + '", deps: ["scripts/' + upath + '"]};</script>';
                                            var defaultScript = "var defaultScript ='" + project + "/scripts/" + upath + ".js';";
                                            var mainJs = "<script>var defaultModel = '" + (project ? project.replace('/', '') + "-" : '') + upath + "'; " + defaultScript + "</script>";
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
            test: {
                options: {
                    open: false,
                    port: 9002,
                    middleware: function(connect) {
                        return [
                            serveStatic('.tmp'),
                            serveStatic('test'),
                            connect().use('/bower_components', serveStatic('./bower_components')),
                            serveStatic(config.app)
                        ];
                    }
                }
            },
            dist: {
                options: {
                    base: '<%= config.dist %>',
                    livereload: false
                }
            }
        }

    });

    //server
    grunt.registerTask('server', function(target) {
        if (target === 'dist') {
            //return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'clean:server',
            'copy:styles',
            'autoprefixer:server',
            'connect:livereload',
            'watch'
        ]);
    });

    //build
    grunt.registerTask('build', [
        'clean:dist',
        'jshint',
        'uglify',
        'sass:dist',
        'autoprefixer:dist',
        'cssmin',
        'copy:dist',
        'usemin',
        'includereplace',
        //'htmlmin',
        'imagemin'
    ]);

    // Default task(s).
    grunt.registerTask('default');

};