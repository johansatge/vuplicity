/**
 * Configuration manager
 * Errors are caught in the main process
 */
(function(require, m)
{

    'use strict';

    var fs = require('fs');

    var module = function(config_path)
    {

        var path = config_path;

        /**
         * Gets the current backups list
         * @todo check JSON structure
         */
        this.getBackups = function()
        {
            var data = _load.apply(this);
            return data.backups;
        };

        /**
         * Loads the configuration file
         * Throws an error if the JSON could not be loaded
         */
        var _load = function()
        {
            var raw_data;
            try
            {
                raw_data = fs.readFileSync(path, {encoding: 'utf8'});
            }
            catch (error)
            {
                raw_data = '[]';
            }
            var data;
            try
            {
                data = JSON.parse(raw_data);
            }
            catch (error)
            {
                data = false;
                throw new Error('The configuration file was not read correctly.\nPlease check its syntax and restart the app.');
            }
            return data;
        };

    };

    m.exports = module;

})(require, module);