/**
 * Created by Administrator on 2017/8/23.
 */

global.webapi = 'http://localhost:3001/';
global.hostconfig = {
    'http://localhost:3001/': [
        /\/example\//
    ],
    'http://127.0.0.1:3001/': [
        /\/leader\//
    ]
};

//example includereplace config
var commonConfig = {
    dist: {
        options: {
            prefix: '@@',
            suffix: '',
            wwwroot: 'example',
            globals: {
                webapi: global.webapi,
                DEBUG: 1,
                BUILD: new Date().getTime()
            },
            includesDir: '',
            docroot: '.'
        },
        src: '<%= config.dist %>/**/*.{js,html}',
        dest: './'
    }
};

global.IRConfig = {
    common: commonConfig
};