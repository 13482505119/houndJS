var libpath = require("path");

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

    // Make replacements
    str = replace(str, localVars);

    // Process includes
    str = include(str, path.dirname(src));

    return str;
}

exports.includereaplace = includereaplace;