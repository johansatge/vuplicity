/**
 * Configuration file manager
 * @todo refactor this, make async
 */
(function(require, m)
{

    'use strict';

    var fs = require('fs');

    var module = function(config_path)
    {

        var path = config_path;

        /**
         * Updates the needed backup
         * @param data
         * @param callback
         */
        this.updateSync = function(data, callback)
        {
            try
            {
                var dir_path = path.substring(0, path.lastIndexOf('/'));
                try
                {
                    var stats = fs.statSync(dir_path);
                    if (!stats.isDirectory())
                    {
                        callback('Settings directory is not a directory.');
                        return;
                    }
                }
                catch (error)
                {
                    try
                    {
                        fs.mkdirSync(dir_path);
                    }
                    catch (error)
                    {
                        callback('Settings directory could not be created.');
                        return;
                    }
                }
                fs.writeFileSync(path, JSON.stringify(data, null, 4), {encoding: 'utf8'});
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
         * @param callback
         */
        this.deleteSync = function(callback)
        {
            try
            {
                fs.readFileSync(path, {encoding: 'utf8'});
            }
            catch (error)
            {
                callback(false);
            }
            try
            {
                fs.unlinkSync(path);
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
         */
        this.loadSync = function()
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
