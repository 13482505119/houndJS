/**
 * Created by Administrator on 2017/8/23.
 */

//example includereplace config
var exampleConfig = {
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


global.IRConfig = {
    example: exampleConfig
};