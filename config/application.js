/**
 * Created by Administrator on 2017/8/23.
 */

global.webapi = 'http://localhost:3001/';

//example includereplace config
var exampleConfig = {
    dist: {
        options: {
            prefix: '@@',
            suffix: '',
            wwwroot: 'example',
            globals: {
                webapi: 'http://localhost:3001/',
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