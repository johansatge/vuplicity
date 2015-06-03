/**
 * Main model
 * Contains available backup-related tasks
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
    var emitter = null;

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
    module.init = function(config_path)
    {
        appConfig = new Configuration(config_path);
        emitter = new events.EventEmitter();
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

    /**
     * Inits and returns the current backups list
     */
    module.initAndGetBackups = function()
    {
        var backups = appConfig.getBackups();
        for (var index in backups)
        {
            duplicityHelpers[index] = new Duplicity(index); // @todo create a new helper when adding a backup from the UI
            duplicityHelpers[index].onOutput(_onDuplicityOutput.bind(this));
            duplicityHelpers[index].setData(backups[index]);
            //Scheduler.updateBackup(index, backups[index]);
        }
        //Scheduler.onScheduledEvent(_onScheduledEvent.bind(this));
        return backups;
    };

    /**
     * Gets the status of the needed backup
     * @param backup_id
     */
    module.refreshBackupStatus = function(backup_id)
    {
        emitter.emit('ui-processing', backup_id, 'Refreshing status...');
        duplicityHelpers[backup_id].getStatus(function(error, status)
        {
            emitter.emit('status-refreshed', backup_id, error, status);
            emitter.emit('ui-idle', backup_id, error ? error : 'Status updated.');
        });
    };

    /**
     * Gets the file tree of the needed backup
     * @param backup_id
     */
    module.refreshBackupTree = function(backup_id)
    {
        emitter.emit('ui-processing', backup_id, 'Refreshing file tree...');
        duplicityHelpers[backup_id].getFiles(function(error, tree)
        {
            emitter.emit('file-tree-refreshed', backup_id, error, tree);
            emitter.emit('ui-idle', backup_id, error ? error : 'Files refreshed.');
        });
    };

    /**
     * Saves the settings of a backup
     * @param backup_id
     * @param backup_data
     */
    module.saveBackupSettings = function(backup_id, backup_data)
    {
        emitter.emit('ui-processing', backup_id, 'Saving settings...');
        appConfig.updateBackup(backup_id, backup_data, function(error)
        {
            if (error === false)
            {
                Scheduler.updateBackup(backup_id, backup_data);
                duplicityHelpers[backup_id].setData(backup_data);
                emitter.emit('backup-saved', backup_id, error, backup_data);
            }
            emitter.emit('ui-idle', backup_id, error ? error : 'Settings saved.');
        });
    };

    /**
     * Cancels the current process for the given backup (may be a backup task, a status update...)
     * @param backup_id
     */
    module.cancelProcess = function(backup_id)
    {
        duplicityHelpers[backup_id].cancel();
    };

    /**
     * Starts a backup
     * @param backup_id
     * @param context
     */
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
            emitter.emit('ui-processing', backup_id, 'Backup in progress...');
            duplicityHelpers[backup_id].doBackup(type, function(error)
            {
                emitter.emit('ui-idle', backup_id, error ? error : 'Backup done.');
                if (!error)
                {
                    module.refreshBackupStatus(backup_id);
                }
            });
        });
    };

    /**
     * Deletes a backup
     * @param backup_id
     * @param context
     */
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
                emitter.emit('ui-processing', backup_id, 'Deleting backup...');
                appConfig.deleteBackup(backup_id, function(error)
                {
                    if (!error)
                    {
                        delete duplicityHelpers[backup_id];
                        emitter.emit('backup-deleted', backup_id);
                    }
                    else
                    {
                        emitter.emit('ui-idle', backup_id, error);
                    }
                });
            }
        });
    };

    /**
     * Restores a file from the given backup
     * @param backup_id
     * @param path
     * @param context
     */
    module.restoreFile = function(backup_id, path, context)
    {
        var backup_data = appConfig.getBackupData(backup_id);
        dialog.showSaveDialog(context, {title: 'Select the restore destination', defaultPath: backup_data.path}, function(dest_path)
        {
            if (typeof dest_path !== 'undefined')
            {
                emitter.emit('ui-processing', backup_id, 'Restoring file...');
                duplicityHelpers[backup_id].restoreFile(path, dest_path, function(error)
                {
                    emitter.emit('ui-idle', backup_id, error ? error : 'File restored.');
                });
            }
        });
    };

    /**
     * Restore all files from the given backup
     * @param backup_id
     * @param context
     */
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
                emitter.emit('ui-processing', backup_id, 'Restoring all files...');
                duplicityHelpers[backup_id].restoreTree(destination_path, function(error)
                {
                    emitter.emit('ui-idle', backup_id, error ? error : 'Backup tree restored.');
                });
            }
        });
    };

    /**
     * Triggers a scheduled event
     * @param backup_id
     *
     var _onScheduledEvent = function(backup_id)
     {
         console.log('@todo start backup if not already running (' + backup_id + ')');
     };*/

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