/**
 * Main model
 * Manages the backups list
 */
(function(m, require)
{

    'use strict';

    var events = require('events');
    var glob = require('glob');
    var dialog = require('dialog');
    var Backup = require(__dirname + '/backup.js');

    var module = {};
    var emitter = new events.EventEmitter();
    var backups = {};

    /**
     * Registers an event
     * @param evt
     * @param callback
     */
    module.on = function(evt, callback)
    {
        emitter.on(evt, callback);
    };

    /**
     * Inits the model
     * @param config_path
     */
    module.initAndGetBackups = function(config_path)
    {
        var files = glob.sync(config_path + '/backup-*.json', {});
        var data = {};
        for (var index = 0; index < files.length; index += 1)
        {
            var id = files[index].substr(files[index].lastIndexOf('/') + 1);
            backups[id] = new Backup();
            data[id] = backups[id].init(id, files[index], _onBackupEvent.bind(this));
        }
        //Scheduler.onScheduledEvent(_onScheduledEvent.bind(this));
        return data;
    };

    /**
     * Returns the requested backup item
     * @param id
     */
    module.getBackup = function(id)
    {
        return backups[id];
    };

    /**
     * Selects the directory of a backup
     * @param backup_id
     * @param context
     */
    module.selectBackupDirectory = function(backup_id, context)
    {
        dialog.showOpenDialog(context, {title: 'Select directory', properties: ['openDirectory']}, function(paths)
        {
            if (typeof paths !== 'undefined')
            {
                events.emit('directory-selected', backup_id, paths[0]);
            }
        });
    };

    var _onBackupEvent = function()
    {
        emitter.emit.apply(emitter, arguments);
    };

    m.exports = module;

})(module, require);