// var fs = require("fs");
var libpath = require("path");
// var str = fs.readFileSync("jf.js").toString();

function formatName(wwwroot, path) {

    path = path.replace(wwwroot, "");

    var name = libpath.basename(path).replace(libpath.extname(path), "");

    var paths = path.split("/");

    var project = "";
    for (var i in paths) {
        if (paths[i].trim() == "") continue;

        project = paths[i];
        break;
    }

    return project + "-" + name;
}

function formatImport(str) {
    var regall = /var(.*?)=.*?d_import\(\"(.*?)\"\).*?;/ig;
    var reg = /var(.*?)=.*?d_import\(\"(.*?)\"\).*?;/i;

    var importStr = str.match(regall);
    var imp = {},
        isimport = false;
    for (var i in importStr) {
        isimport = true;
        str = str.replace(importStr[i], "");
        var tmp = importStr[i].match(reg);
        var $var = tmp[1].trim();
        var $val = tmp[2].trim();

        imp[$var] = $val;
    }

    if (isimport) return {
        imp: imp,
        html: str.trim()
    };
    return false;
}

function formatImportContent(name, imports, javascriptString) {
    if (javascriptString.indexOf("!d_import") != -1) return javascriptString;
    if (/define\(.*?function.*?/i.test(javascriptString)) return javascriptString;

    var defineTemplate = function() {
        function template() {
            /*
             define('{name}', [{imports}], function({args}) {

             {content}

             return {
             pageIn: _swa(typeof(pageIn)) ? pageIn : emptyfunc,
             pageOut: _swa(typeof(pageOut)) ? pageOut : emptyfunc,
             animateEnd: _swa(typeof(animateEnd)) ? pageOut : emptyfunc
             };
             });
             */
        };

        var lines = new String(template);
        return lines.substring(lines.indexOf('/*') + 3, lines.indexOf("*/"));
    };

    var template = defineTemplate().replace("{name}", name);

    if (imports) {
        var key = "",
            val = [];
        for (var i in imports) key += i + ",";
        for (var i in imports) val += "'" + imports[i] + "',";
        template = template.replace("{args}", key.substring(0, key.length - 1));
        template = template.replace("{imports}", val.substring(0, val.length - 1));
    } else {
        template = template.replace("{imports}", "");
        template = template.replace("{args}", "");
    }

    return template.replace("{content}", javascriptString);
}

function formatImp(wwwroot, path, str) {
    if (libpath.extname(path) != ".js") return str;
    var ips = formatImport(str);
    var ip = !ips ? false : ips['imp'];
    str = !ips ? str : ips['html'];
    return formatImportContent(formatName(wwwroot, path), ip, str);
}




function includereaplace(grunt, options, str, src) {
    var globalVars = options.globals;

    var _ = grunt.util._;
    var path = require('path');

    // Names of our variables
    var globalVarNames = Object.keys(globalVars);

    globalVarNames.forEach(function(globalVarName) {
        if (_.isString(globalVars[globalVarName])) {
            globalVars[globalVarName] = globalVars[globalVarName];
        } else {
            globalVars[globalVarName] = JSON.stringify(globalVars[globalVarName]);
        }
    });

    // Cached variable regular expressions
    var globalVarRegExps = {};

    var includeRegExp = new RegExp(options.prefix + 'include\\(\\s*["\'](.*?)["\'](,\\s*({[\\s\\S]*?})){0,1}\\s*\\)' + options.suffix);

    function replace(contents, localVars) {

        localVars = localVars || {};

        var varNames = Object.keys(localVars);
        var varRegExps = {};

        // Replace local vars
        varNames.forEach(function(varName) {

            // Process lo-dash templates (for strings) in global variables and JSON.stringify the rest
            if (_.isString(localVars[varName])) {
                localVars[varName] = grunt.template.process(localVars[varName]);
            } else {
                localVars[varName] = JSON.stringify(localVars[varName]);
            }

            varRegExps[varName] = varRegExps[varName] || new RegExp(options.prefix + varName + options.suffix, 'g');

            contents = contents.replace(varRegExps[varName], localVars[varName]);
        });

        // Replace global variables
        globalVarNames.forEach(function(globalVarName) {

            globalVarRegExps[globalVarName] = globalVarRegExps[globalVarName] || new RegExp(options.prefix + globalVarName + options.suffix, 'g');

            contents = contents.replace(globalVarRegExps[globalVarName], globalVars[globalVarName]);
        });

        return contents;
    }

    function include(contents, workingDir) {

        var matches = includeRegExp.exec(contents);

        // Create a function that can be passed to String.replace as the second arg

        function createReplaceFn(replacement) {
            return function() {
                return replacement;
            };
        }

        function getIncludeContents(includePath, localVars) {
            var files = grunt.file.expand(includePath),
                includeContents = '';

            files.forEach(function(filePath, index) {
                includeContents += grunt.file.read(filePath);
                // break a line for every file, except for the last one
                includeContents += index !== files.length - 1 ? '\n' : '';

                // Make replacements
                includeContents = replace(includeContents, localVars);

                // Process includes
                includeContents = include(includeContents, path.dirname(filePath));
                if (options.processIncludeContents && typeof options.processIncludeContents === 'function') {
                    includeContents = options.processIncludeContents(includeContents, localVars);
                }
            });

            return includeContents;
        }

        while (matches) {

            var match = matches[0];
            var includePath = matches[1];
            var localVars = matches[3] ? JSON.parse(matches[3]) : {};

            if (!grunt.file.isPathAbsolute(includePath)) {
                includePath = path.resolve(path.join((options.includesDir ? options.includesDir : workingDir), includePath));
            } else {
                if (options.includesDir) {
                    grunt.log.error('includesDir works only with relative paths. Could not apply includesDir to ' + includePath);
                }
                includePath = path.resolve(includePath);
            }

            var docroot = path.relative(path.dirname(includePath), path.resolve(options.docroot)).replace(/\\/g, '/');

            // Set docroot as local var but don't overwrite if the user has specified
            if (localVars.docroot === undefined) {
                localVars.docroot = docroot ? docroot + '/' : '';
            }

            grunt.log.debug('Including', includePath);
            grunt.log.debug('Locals', localVars);

            var includeContents = getIncludeContents(includePath, localVars);
            contents = contents.replace(match, createReplaceFn(includeContents));

            matches = includeRegExp.exec(contents);
        }

        return contents;
    }

    var docroot = path.relative(path.dirname(src), path.resolve(options.docroot)).replace(/\\/g, '/');
    var localVars = {
        docroot: docroot ? docroot + '/' : ''
    };

    grunt.log.debug('Locals', localVars);

    str = formatImp(options.wwwroot, src, str);
    // Make replacements
    str = replace(str, localVars);

    // Process includes
    str = include(str, path.dirname(src));

    return str;
}

exports.formatImportContent = formatImp;
exports.includereaplace = includereaplace;