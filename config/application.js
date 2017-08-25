/**
 * Created by Administrator on 2017/8/23.
 */

global.webapi = 'http://localhost:9008/';

//example includereplace config
var exampleConfig = {
    dist: {
        options: {
            prefix: '@@',
            suffix: '',
            wwwroot: 'example',
            globals: {
                DEBUG: 1,
                BUILD: new Date().getTime()
            },
            includesDir: '',
            docroot: '.'
        },
        src: 'example/*.{js,html}',
        dest: './'
    }
};

global.IRConfig = {
    example: exampleConfig
};