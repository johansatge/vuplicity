/**
 * Backup item
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
        var eventCallback = null;

        /**
         * Inits the backup item
         * @param id
         * @param config_path
         * @param event_callback
         */
        this.init = function(id, config_path, event_callback)
        {
            eventCallback = event_callback;
            backupID = id;
            configHelper = new Configuration(config_path);
            backupData = configHelper.load(); // @todo if FALSE, throw an error
            duplicityHelper = new Duplicity(id);
            duplicityHelper.setData(backupData);
            duplicityHelper.onOutput(_onDuplicityOutput.bind(this));
            return backupData;
        };

        /**
         * Gets the status of the needed backup
         */
        this.refreshBackupStatus = function()
        {
            eventCallback('ui-processing', backupID, 'Refreshing status...');
            duplicityHelper.getStatus(function(error, status)
            {
                eventCallback('status-refreshed', backupID, error, status);
                eventCallback('ui-idle', backupID, error ? error : 'Status updated.');
            });
        };

        /**
         * Gets the file tree of the needed backup
         */
        this.refreshBackupTree = function()
        {
            eventCallback('ui-processing', backupID, 'Refreshing file tree...');
            duplicityHelper.getFiles(function(error, tree)
            {
                eventCallback('file-tree-refreshed', backupID, error, tree);
                eventCallback('ui-idle', backupID, error ? error : 'Files refreshed.');
            });
        };

        /**
         * Saves the settings of a backup
         * @param backup_data
         */
        this.saveBackupSettings = function(backup_data)
        {
            eventCallback('ui-processing', backupID, 'Saving settings...');
            configHelper.updateBackup(backupID, backup_data, function(error)
            {
                if (error === false)
                {
                    //Scheduler.updateBackup(backupID, backup_data);
                    duplicityHelper.setData(backup_data);
                    backupData = backup_data;
                    eventCallback('backup-saved', backupID, error, backup_data);
                }
                eventCallback('ui-idle', backupID, error ? error : 'Settings saved.');
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
            dialog.showMessageBox(context, params, function(response)
            {
                var type = response === 0 ? '' : 'full';
                eventCallback('ui-processing', backupID, 'Backup in progress...');
                duplicityHelper.doBackup(type, function(error)
                {
                    eventCallback('ui-idle', backupID, error ? error : 'Backup done.');
                    if (!error)
                    {
                        this.refreshBackupStatus(backupID);
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
                    eventCallback('ui-processing', backupID, 'Deleting backup...');
                    configHelper.deleteBackup(backupID, function(error)
                    {
                        if (!error)
                        {
                            eventCallback('backup-deleted', backupID);
                        }
                        else
                        {
                            eventCallback('ui-idle', backupID, error);
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
                    eventCallback('ui-processing', backupID, 'Restoring file...');
                    duplicityHelper.restoreFile(path, dest_path, function(error)
                    {
                        eventCallback('ui-idle', backupID, error ? error : 'File restored.');
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
                    eventCallback('ui-processing', backupID, 'Restoring all files...');
                    duplicityHelper.restoreTree(destination_path, function(error)
                    {
                        eventCallback('ui-idle', backupID, error ? error : 'Backup tree restored.');
                    });
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
         * @param backupID
         * @param output
         */
        var _onDuplicityOutput = function(backupID, output)
        {
            eventCallback('cli-output', backupID, output);
        };

    };

    m.exports = module;

})(module, require);