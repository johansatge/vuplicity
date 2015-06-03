/**
 * Main model
 * @todo refactor with appConfig, add comments
 */
(function(m, require)
{

    'use strict';

    var events = require('events');
    var dialog = require('dialog');
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
        emitter.emit('ui', backup_id, 'processing', 'Refreshing status...');
        duplicityHelpers[backup_id].getStatus(function(error, status)
        {
            emitter.emit('status-refreshed', backup_id, error, status);
            emitter.emit('ui', backup_id, 'idle', error ? error : 'Status updated.');
        });
    };

    module.refreshBackupTree = function(backup_id)
    {
        emitter.emit('ui', backup_id, 'processing', 'Refreshing file tree...');
        duplicityHelpers[backup_id].getFiles(function(error, tree)
        {
            emitter.emit('file-tree-refreshed', backup_id, error, tree);
            emitter.emit('ui', backup_id, 'idle', error ? error : 'Files refreshed.');
        });
    };

    module.saveBackupSettings = function(backup_id, backup_data)
    {
        emitter.emit('ui', backup_id, 'processing', 'Saving settings...');
        appConfig.updateBackup(backup_id, backup_data, function(error)
        {
            if (error === false)
            {
                Scheduler.updateBackup(backup_id, backup_data);
                duplicityHelpers[backup_id].setData(backup_data);
                emitter.emit('settings-saved', backup_id, error, backup_data);
            }
            emitter.emit('ui', backup_id, 'idle', error ? error : 'Settings saved.');
        });
    };

    module.cancelProcess = function(backup_id)
    {
        duplicityHelpers[backup_id].cancel();
    };

    module.startBackup = function(backup_id, context)
    {
        var params = {
            type: 'info',
            message: 'What task do you want to start ?',
            buttons: ['Automatic backup', 'Full backup']
        };
        dialog.showMessageBox(context, params, function(response)
        {
            var type = response === 0 ? '' : 'full';
            emitter.emit('ui', backup_id, 'processing', 'Backup in progress...');
            duplicityHelpers[backup_id].doBackup(type, function(error)
            {
                emitter.emit('ui', backup_id, 'idle', error ? error : 'Backup done.');
                if (!error)
                {
                    module.refreshBackupStatus(backup_id);
                }
            });
        });
    };

    module.deleteBackup = function(backup_id, context)
    {
        var params = {
            type: 'warning',
            message: 'Do you want to delete this backup ?',
            detail: 'The entry will be removed.\nNothing will be modified on the remote server.',
            buttons: ['Delete', 'Cancel']
        };
        dialog.showMessageBox(context, params, function(response)
        {
            if (response === 0)
            {
                emitter.emit('ui', backup_id, 'processing', 'Deleting backup...');
                appConfig.deleteBackup(backup_id, function(error)
                {
                    if (!error)
                    {
                        delete duplicityHelpers[backup_id];
                        emitter.emit('backup-deleted', backup_id);
                    }
                    else
                    {
                        emitter.emit('ui', backup_id, 'idle', 'error');
                    }
                });
            }
        });
    };

    module.restoreFile = function(backup_id, path, context)
    {
        var backup_data = appConfig.getBackupData(backup_id);
        var params = {
            title: 'Select the restore destination',
            defaultPath: backup_data.path
        };
        dialog.showSaveDialog(context, params, function(destination_path)
        {
            if (typeof destination_path !== 'undefined')
            {
                emitter.emit('ui', backup_id, 'processing', 'Restoring file...');
                duplicityHelpers[backup_id].restoreFile(path, destination_path, function(error)
                {
                    emitter.emit('ui', backup_id, 'idle', error ? error : 'File restored.');
                });
            }
        });
    };

    module.restoreTree = function(backup_id, context)
    {
        var backup_data = appConfig.getBackupData(backup_id);
        var params = {
            title: 'Select the restore destination',
            defaultPath: backup_data.path,
            properties: ['openDirectory', 'createDirectory']
        };
        dialog.showOpenDialog(context, params, function(destination_path)
        {
            if (typeof destination_path !== 'undefined')
            {
                emitter.emit('ui', backup_id, 'processing', 'Restoring all files...');
                duplicityHelpers[backup_id].restoreTree(destination_path, function(error)
                {
                    emitter.emit('ui', backup_id, 'idle', error ? error : 'Backup tree restored.');
                });
            }
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