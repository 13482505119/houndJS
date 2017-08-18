/**
 * Created by Administrator on 2017/8/17.
 */
var fs = require('fs');
module.exports = function(grunt) {
    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Configurable paths
    var config = {
        app: 'test',
        dist: 'dist',
        path: "**"
    };

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        //sass: {
        //    output : {
        //        options: {
        //            style: sassStyle
        //        },
        //        files: {
        //            './style.css': './scss/style.scss'
        //        }
        //    }
        //},
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        'dist/*',
                        '!dist/.git*'
                    ]
                }]
            },
            server: '.tmp'
        },
        concat: {
            options: {
                separator: ';'
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
                dest: 'dist/vendor.js'
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
                    expand:	true,
                    cwd:	'dist',
                    src:	['*.js','!*.min.js'],
                    dest:	'dist',
                    ext:	'.min.js',
                    extDot:	'last'
                }]
            }
        },

        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= config.app %>',
                    dest: '<%= config.dist %>',
                    src: [
                        '*.{ico,png,txt,jpg,jpeg,gif}',
                        '.htaccess',
                        'images/{,*/}*.webp',
                        'images/{,*/}*.png',
                        '<%= config.path%>/{,*/}*.html',
                        '{scripts,<%= config.path%>}/{,*/}*.js',
                        '{scripts,<%= config.path%>}/{,*/}*.{ico,png,txt,jpeg,jpg,gif}',
                        // '**/server/{,*/}*.js',
                        '{styles,<%= config.path%>}/{,*/}*.css',
                        'styles/fonts/{,*/}*.*',
                        '<%= config.path%>/{,*/}*.{png,txt,ico}'
                        // 'mall/{,*/}*.html',
                    ]
                }]
            },
            styles: {
                expand: true,
                dot: true,
                cwd: '<%= config.app %>/',
                dest: '.tmp/',
                src: '{scripts,<%= config.path%>}/{,*/}*.css'
            }
        },

        cssmin: {
            dist: {
                files: {
                    'dist/docs.min.css': [
                        'bower_components/bootstrap/dist/css/bootstrap.min.css',
                        'test/css/buttons.css',
                        'test/css/animate.css',
                        'test/css/bootstrap-extend.css',
                        'bower_components/sweetalert2/dist/sweetalert2.min.css',
                        'test/css/docs.css'
                    ]
                }
            }
        },
        jshint: {
            dist: ['src/*.js']
        },
        watch: {
            bower: {
                files: ['bower.json'],
                tasks: ['bowerInstall']
            },
            scripts: {
                files: ['./src/plugin.js','./src/plugin2.js'],
                tasks: ['concat','jshint','uglify']
            },
            sass: {
                files: ['./scss/style.scss'],
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
        connect: {
            options: {
                port: 9000,
                open: true,
                livereload: 35729,
                // Change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            server: {
                options: {
                    port: 9001,
                    base: './'
                }
            }
        },

        // Run some tasks in parallel to speed up build process
        concurrent: {
            server: [
                // 'sass', :sass
                'copy:styles'
            ],
            test: [
                'copy:styles'
            ],
            dist: [
                // 'sass', :sass
                'copy:styles',
                'imagemin',
                'svgmin'
            ]
        }
    });

    grunt.registerTask('serve', function (target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'clean:server',
            'concurrent:server',
            'autoprefixer',
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('server', function (target) {
        grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
        grunt.task.run([target ? ('serve:' + target) : 'serve']);
    });

    // Load the plugin that provides the "uglify" task.
    //grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('build', [
        'jshint',
        'clean',
        'concat',
        'cssmin',
        'uglify'
    ]);

    grunt.registerTask('watchit',['concat','jshint','uglify','connect','watch']);

    // Default task(s).
    grunt.registerTask('default');

};