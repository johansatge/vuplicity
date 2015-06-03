/**
 * Configuration file manager
 * @todo refactor this and check file structure
 * @todo check if dir exists; or create it and throw an error if needed
 */
(function(require, m)
{

    'use strict';

    var fs = require('fs');
    var glob = require('glob');
    var crypto = require('crypto');

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
            var files = glob.sync(path + '/backup-*.json', {});
            for (var index = 0; index < files.length; index += 1)
            {
                var data = _load.apply(this, [files[index]]);
                var id = files[index].substr(files[index].lastIndexOf('/') + 1);
                if (typeof data === 'object')
                {
                    items[id] = data;
                }
            }
            return items;
        };

        /**
         * Updates the needed backup
         * @param id
         * @param data
         */
        this.updateBackup = function(id, data, callback)
        {
            try
            {
                fs.writeFileSync(path + '/' + id, JSON.stringify(data), {encoding: 'utf8'});
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
            try
            {
                delete items[id];
                fs.unlinkSync(path + '/' + id);
                callback(false);
                return;
            }
            catch (error)
            {
            }
            callback('Settings could not be deleted.');
        };

        /**
         * Loads a configuration file
         * Throws an error if the JSON could not be loaded
         * @param filepath
         */
        var _load = function(filepath)
        {
            var raw_data;
            try
            {
                raw_data = fs.readFileSync(filepath, {encoding: 'utf8'});
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