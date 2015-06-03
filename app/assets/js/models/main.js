/**
 * Main model
 */
(function(m, require)
{

    'use strict';

    var events = require('events');
    var Configuration = require(__dirname + '/../utils/configuration.js');
    var Duplicity = require(__dirname + '/../utils/duplicity.js');
    var Scheduler = require(__dirname + '/../utils/scheduler.js');

    var module = {};
    var appConfig = null;
    var duplicityHelpers = {};
    var emitter = new events.EventEmitter();

    module.on = function(evt, callback)
    {
        emitter.on(evt, callback);
    };

    module.init = function(config_path)
    {
        appConfig = new Configuration(config_path);
    };

    module.initAndGetBackups = function()
    {
        var backups = appConfig.getBackups();
        for (var index in backups)
        {
            duplicityHelpers[index] = new Duplicity(index);
            duplicityHelpers[index].onOutput(_onDuplicityOutput.bind(this));
            duplicityHelpers[index].setData(backups[index]);
            Scheduler.updateBackup(index, backups[index]);
        }
        Scheduler.onScheduledEvent(_onScheduledEvent.bind(this));
        return backups;
    };

    module.refreshBackupStatus = function(backup_id)
    {
        duplicityHelpers[backup_id].getStatus(function(error, status)
        {
            emitter.emit('status-refreshed', backup_id, error, status);
        });
    };

    module.refreshBackupTree = function(backup_id)
    {
        duplicityHelpers[backup_id].getFiles(function(error, tree)
        {
            emitter.emit('file-tree-refreshed', backup_id, error, tree);

        });
    };

    module.saveBackupSettings = function(backup_id, backup_data)
    {
        appConfig.updateBackup(backup_id, backup_data, function(error)
        {
            if (error === false)
            {
                Scheduler.updateBackup(backup_id, backup_data);
                duplicityHelpers[backup_id].setData(backup_data);
            }
            emitter.emit('settings-saved', backup_id, error, backup_data);
        });
    };

    module.cancelProcess = function(backup_id)
    {
        duplicityHelpers[backup_id].cancel();
    };

    module.startBackup = function(backup_id, type)
    {
        duplicityHelpers[backup_id].doBackup(type, function(error, status)
        {
            emitter.emit('backup-done', backup_id, error, status);
        });
    };

    module.deleteBackup = function(backup_id)
    {
        appConfig.deleteBackup(backup_id, function(error)
        {
            if (!error)
            {
                delete duplicityHelpers[backup_id];
            }
            emitter.emit('backup-deleted', backup_id, error);
        });
    };

    module.restoreFile = function(backup_id, path, destination_path)
    {
        duplicityHelpers[backup_id].restoreFile(path, destination_path, function(error)
        {
            events.emit('file-restored', backup_id, error);
        });
    };

    module.restoreTree = function(backup_id, destination_path)
    {
        duplicityHelpers[backup_id].restoreTree(destination_path, function(error)
        {
            events.emit('tree-restored', backup_id, error);
        });
    };

    /**
     * Triggers a scheduled event
     * @param backup_id
     */
    var _onScheduledEvent = function(backup_id)
    {
        console.log('@todo start backup if not already running (' + backup_id + ')');
    };

    /**
     * Sends Duplicity output to the backup view
     * @param backup_id
     * @param output
     */
    var _onDuplicityOutput = function(backup_id, output)
    {
        emitter.emit('cli-output', backup_id, output);
    };

    m.exports = module;

})(module, require);