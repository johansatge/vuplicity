/**
 * Duplicity helper
 */
(function(require, m)
{

    'use strict';

    var exec = require('child_process').exec;

    var module = function()
    {

        /**
         * Lists the current files in a backup
         * @param url
         * @param pass
         */
        this.getFiles = function(url, pass, callback)
        {
            var options = {env: {PASSPHRASE: pass}};
            exec('duplicity list-current-files ' + url, options, function(error, stdout, stderr)
            {
                var regex = /[a-zA-Z]{3}.*[0-9]{4} (.*)\n/gm;
                var tree = [];
                var match;
                while (match = regex.exec(stdout))
                {
                    if (match[1] !== 'undefined')
                    {
                        var path = match[1];
                        if (path === '.' || path === '..')
                        {
                            continue;
                        }
                        tree.push({
                            dir: path.search('/') !== -1 ? path.substring(0, path.lastIndexOf('/')) : '.',
                            name: path.substring(path.lastIndexOf('/') + 1)
                        });
                    }
                }
                callback(_parseError.apply(this, [stderr]), tree);
            });
        };

        /**
         * Gets the current status of a backup
         * @param url
         * @param pass
         * @param callback
         */
        this.getStatus = function(url, pass, callback)
        {
            var options = {env: {PASSPHRASE: pass}};
            exec('duplicity collection-status ' + url, options, function(error, stdout, stderr)
            {
                var data = _parseOutput.apply(this, [stdout, {
                    chain_start_time: /Chain start time: ([^\n]+)/gm,
                    chain_end_time: /Chain end time: ([^\n]+)/gm,
                    backup_sets: /Number of contained backup sets: ([0-9]+)/gm
                }]);
                callback(_parseError.apply(this, [stderr]), data);
            });
        };

        /**
         * Parses stdout and gets the required vars
         * @param output
         * @param variables
         */
        var _parseOutput = function(output, variables)
        {
            var data = {};
            for (var variable in variables)
            {
                var regex = variables[variable].exec(output);
                data[variable] = regex !== null && typeof regex[1] !== 'undefined' ? regex[1] : '';
            }
            return data;
        };

        /**
         * Parses an error message
         * @param stderr
         */
        var _parseError = function(stderr)
        {
            if (stderr.replace(/[ \n\t]*/gm, '').length > 0)
            {
                return stderr;
            }
            return false;
        };

    };

    m.exports = module;

})(require, module);