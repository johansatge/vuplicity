/**
 * Devtools
 */
(function(require, m)
{

    'use strict';

    var yargs = require('yargs');

    var module = {};

    /**
     * Checks if dev mode is enabled
     */
    module.devModeEnabled = function()
    {
        var argv = require('yargs').argv;
        return typeof argv.dev !== 'undefined' && argv.dev;
    };

    m.exports = module;

})(require, module);