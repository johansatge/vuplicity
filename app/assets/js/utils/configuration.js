/**
 * Configuration manager
 * Errors are caught in the main process
 * @todo refactor this
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
         */
        this.getBackups = function()
        {
            var current_data = _load.apply(this);
            if (typeof current_data === 'object' && typeof current_data.backups === 'object')
            {
                return current_data.backups;
            }
            return false;
        };

        /**
         * Updates the needed backup
         * @param id
         * @param data
         */
        this.updateBackup = function(id, data)
        {
            var backups = this.getBackups();
            if (backups !== false)
            {
                try
                {
                    backups[id] = data;
                    fs.writeFileSync(path, JSON.stringify({backups: backups}), {encoding: 'utf8'});
                    return true;
                }
                catch (error)
                {
                }
            }
            return false;
        };

        /**
         * Deletes a backup
         * @param id
         */
        this.deleteBackup = function(id)
        {
            var backups = this.getBackups();
            if (backups !== false)
            {
                try
                {
                    delete backups[id];
                    fs.writeFileSync(path, JSON.stringify({backups: backups}), {encoding: 'utf8'});
                    return true;
                }
                catch (error)
                {
                }
            }
            return false;
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
                raw_data = '{}';
            }
            var data;
            try
            {
                data = JSON.parse(raw_data);
            }
            catch (error)
            {
                data = false;
            }
            return data;
        };

    };

    m.exports = module;

})(require, module);