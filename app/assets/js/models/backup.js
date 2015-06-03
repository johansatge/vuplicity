/**
 * Backup model
 * Contains all backup-related actions: status, backup, restore...
 */
(function(m, require)
{

    'use strict';

    var dialog = require('dialog');
    var Duplicity = require(__dirname + '/../utils/duplicity.js');
    var Scheduler = require(__dirname + '/../utils/scheduler.js');
    var Configuration = require(__dirname + '/../utils/configuration.js');

    var module = function()
    {

        var duplicityHelper = null;
        var configHelper = null;
        var backupID = null;
        var backupData = null;
        var eventEmitter = null;

        /**
         * Inits the backup item
         * @param id
         * @param config_path
         * @param emitter
         */
        this.init = function(id, config_path, emitter)
        {
            eventEmitter = emitter;
            backupID = id;
            configHelper = new Configuration(config_path);
            backupData = configHelper.load(); // @todo if FALSE, throw an error
            duplicityHelper = new Duplicity();
            duplicityHelper.onOutput(_onDuplicityOutput.bind(this));
            return backupData;
        };

        /**
         * Gets backup status
         */
        this.refreshBackupStatus = function()
        {
            eventEmitter.emit('ui-processing', backupID, 'Refreshing status...');
            duplicityHelper.getStatus(backupData, function(error, status)
            {
                eventEmitter.emit('status-refreshed', backupID, status);
                eventEmitter.emit('ui-idle', backupID, error ? error : 'Status updated.');
            });
        };

        /**
         * Gets backup file tree
         */
        this.refreshBackupTree = function()
        {
            eventEmitter.emit('ui-processing', backupID, 'Refreshing file tree...');
            duplicityHelper.getFiles(backupData, function(error, tree)
            {
                eventEmitter.emit('file-tree-refreshed', backupID, tree);
                eventEmitter.emit('ui-idle', backupID, error ? error : 'Files refreshed.');
            });
        };

        /**
         * Saves backup settings
         * @param backup_data
         */
        this.saveBackupSettings = function(backup_data)
        {
            eventEmitter.emit('ui-processing', backupID, 'Saving settings...');
            configHelper.updateBackup(backupID, backup_data, function(error)
            {
                if (error === false)
                {
                    //Scheduler.updateBackup(backupID, backup_data);
                    backupData = backup_data;
                    eventEmitter.emit('backup-saved', backupID, backup_data);
                }
                eventEmitter.emit('ui-idle', backupID, error ? error : 'Settings saved.');
            });
        };

        /**
         * Cancels the current process for the given backup (may be a backup task, a status update...)
         */
        this.cancelProcess = function()
        {
            duplicityHelper.cancel();
        };

        /**
         * Starts a backup
         * @param context
         */
        this.startBackup = function(context)
        {
            var params = {
                type: 'info',
                message: 'What task do you want to start ?',
                buttons: ['Automatic backup', 'Full backup']
            };
            var self = this;
            dialog.showMessageBox(context, params, function(response)
            {
                var type = response === 0 ? '' : 'full';
                eventEmitter.emit('ui-processing', backupID, 'Backup in progress...');
                duplicityHelper.doBackup(backupData, type, function(error)
                {
                    eventEmitter.emit('ui-idle', backupID, error ? error : 'Backup done.');
                    if (!error)
                    {
                        self.refreshBackupStatus(backupID);
                    }
                });
            });
        };

        /**
         * Deletes a backup
         * @param context
         */
        this.deleteBackup = function(context)
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
                    eventEmitter.emit('ui-processing', backupID, 'Deleting backup...');
                    configHelper.deleteBackup(backupID, function(error)
                    {
                        if (!error)
                        {
                            eventEmitter.emit('backup-deleted', backupID);
                        }
                        else
                        {
                            eventEmitter.emit('ui-idle', backupID, error);
                        }
                    });
                }
            });
        };

        /**
         * Restores a file from the given backup
         * @param path
         * @param context
         */
        this.restoreFile = function(path, context)
        {
            dialog.showSaveDialog(context, {title: 'Select the restore destination', defaultPath: backupData.path}, function(dest_path)
            {
                if (typeof dest_path !== 'undefined')
                {
                    eventEmitter.emit('ui-processing', backupID, 'Restoring file...');
                    duplicityHelper.restoreFile(backupData, path, dest_path, function(error)
                    {
                        eventEmitter.emit('ui-idle', backupID, error ? error : 'File restored.');
                    });
                }
            });
        };

        /**
         * Restore all files from the given backup
         * @param context
         */
        this.restoreTree = function(context)
        {
            var params = {
                title: 'Select the restore destination',
                defaultPath: backupData.path,
                properties: ['openDirectory', 'createDirectory']
            };
            dialog.showOpenDialog(context, params, function(destination_path)
            {
                if (typeof destination_path !== 'undefined')
                {
                    eventEmitter.emit('ui-processing', backupID, 'Restoring all files...');
                    duplicityHelper.restoreTree(backupData, destination_path, function(error)
                    {
                        eventEmitter.emit('ui-idle', backupID, error ? error : 'Backup tree restored.');
                    });
                }
            });
        };

        /**
         * Selects a destination directory
         * @param context
         */
        this.selectDirectory = function(context)
        {
            dialog.showOpenDialog(context, {title: 'Select directory', properties: ['openDirectory']}, function(paths)
            {
                if (typeof paths !== 'undefined')
                {
                    eventEmitter('directory-selected', backupID, paths[0]);
                }
            });
        };

        /**
         * Triggers a scheduled event
         * @param backupID
         *
         var _onScheduledEvent = function(backupID)
         {
             console.log('@todo start backup if not already running (' + backupID + ')');
         };*/

        /**
         * Sends Duplicity output to the backup view
         * @param output
         */
        var _onDuplicityOutput = function(output)
        {
            eventEmitter.emit('cli-output', backupID, output);
        };

    };

    m.exports = module;

})(module, require);