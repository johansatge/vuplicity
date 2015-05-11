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
         */
        this.getFiles = function(url)
        {
            exec('duplicity list-current-files ' + url, function(error, stdout, stderr)
            {
                console.log(error);
                console.log(stdout);
                console.log(stderr);
            });
        };

        /**
         * Gets the current status of a backup
         * @param url
         */
        this.getStatus = function(url)
        {
            exec('duplicity collection-status ' + url, function(error, stdout, stderr)
            {
                console.log(error);
                console.log(stdout);
                console.log(stderr);
            });
        };

    };

    m.exports = module;

})(require, module);