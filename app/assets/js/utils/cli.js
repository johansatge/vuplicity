/**
 * Devtools
 */
(function(require, m)
{

    'use strict';

    var yargs = require('yargs');

    var module = {};

    var argv = require('yargs').argv;

    /**
     * Checks if dev tools are enabled
     */
    module.devToolsEnabled = function()
    {
        return typeof argv.devtools !== 'undefined' && argv.devtools;
    };

    /**
     * Checks if a custom config path is set in argv
     */
    module.getCustomConfigPath = function()
    {
        if (typeof argv.configpath !== 'undefined' && typeof argv.configpath === 'string')
        {
            return argv.configpath;
        }
        return false;
    };

    m.exports = module;

})(require, module);