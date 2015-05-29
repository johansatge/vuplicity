/**
 * Configuration file manager
 * @todo refactor this and check file structure
 */
(function(require, m)
{

    'use strict';

    var fs = require('fs');

    var module = function(config_path)
    {

        var path = config_path;
        var items = {};

        /**
         * Returns the informations of a backup
         * @param id
         */
        this.getBackupData = function(id)
        {
            return typeof items[id] !== 'undefined' ? items[id] : {};
        };

        /**
         * Gets the current backups list
         */
        this.getBackups = function()
        {
            var current_data = _load.apply(this);
            if (typeof current_data === 'object' && typeof current_data.backups === 'object')
            {
                items = current_data.backups;
                return current_data.backups;
            }
            return {};
        };

        /**
         * Updates the needed backup
         * @param id
         * @param data
         */
        this.updateBackup = function(id, data, callback)
        {
            var backups = this.getBackups();
            try
            {
                backups[id] = data;
                fs.writeFileSync(path, JSON.stringify({backups: backups}), {encoding: 'utf8'});
                items[id] = data;
                callback(false);
                return;
            }
            catch (error)
            {
            }
            callback('Settings could not be written.');
        };

        /**
         * Deletes a backup
         * @param id
         * @param callback
         */
        this.deleteBackup = function(id, callback)
        {
            var backups = this.getBackups();
            try
            {
                delete backups[id];
                fs.writeFileSync(path, JSON.stringify({backups: backups}), {encoding: 'utf8'});
                callback(false);
                return;
            }
            catch (error)
            {
            }
            callback('Settings could not be written.');
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