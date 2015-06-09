/**
 * Backup model
 * Contains all backup-related actions: status, backup, restore...
 */
(function(m, require)
{

    'use strict';

    var Duplicity = require(__dirname + '/../utils/duplicity.js');
    var Schedules = require(__dirname + '/schedules.js');
    var Configuration = require(__dirname + '/../utils/configuration.js');

    var module = function()
    {

        var duplicityHelper = null;
        var configHelper = null;
        var schedulesHelper = null;
        var backupID = null;
        var backupData = null;
        var eventEmitter = null;
        var outputInterval = null;
        var outputBuffer = '';

        /**
         * Checks and sanitizes the data of a backup
         * @todo check required options: cli_options, passphrase, path, title, url
         * @todo check required schedules props: backup_type, date_hours, date_minutes, interval_basis, interval_minutes, interval_type, monthdays, weekdays
         * @param raw_data
         */
        var _checkData = function(raw_data)
        {
            if (typeof raw_data.options === 'undefined')
            {
                raw_data.options = {};
                raw_data.options.title = '';
            }
            if (typeof raw_data.schedules === 'undefined')
            {
                raw_data.schedules = [];
            }
            return raw_data;
        };

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
            backupData = _checkData.apply(this, [configHelper.loadSync()]);
            duplicityHelper = new Duplicity();
            duplicityHelper.onOutput(_onDuplicityOutput.bind(this));
            schedulesHelper = new Schedules(_onScheduledEvent.bind(this));
            schedulesHelper.setSchedules(backupData.schedules);
            outputInterval = setInterval(_sendOutput.bind(this), 1000);
            return backupData;
        };

        /**
         * Checks if a process is running
         */
        this.isProcessing = function()
        {
            return duplicityHelper.isProcessing();
        };

        /**
         * Gets backup status
         */
        this.refreshBackupStatus = function()
        {
            duplicityHelper.getStatus(backupData.options, function(status)
            {
                eventEmitter.emit('status-refreshed', backupID, status);
            });
        };

        /**
         * Gets backup file tree
         */
        this.refreshBackupTree = function()
        {
            duplicityHelper.getFiles(backupData.options, function(tree)
            {
                eventEmitter.emit('file-tree-refreshed', backupID, tree);
            });
        };

        /**
         * Saves backup settings
         * @param options
         * @param schedules
         */
        this.saveBackupData = function(options, schedules)
        {
            var backup_data = {options: options, schedules: schedules};
            configHelper.updateSync(backup_data, function(error)
            {
                if (error === false)
                {
                    backupData = _checkData.apply(this, [backup_data]);
                    schedulesHelper.setSchedules(backupData.schedules);
                    eventEmitter.emit('backup-saved', backupID, backupData.options, backupData.schedules);
                }
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
         * Starts a scheduled backup
         * @param context
         * @param type
         */
        this.startScheduledBackup = function(context, type)
        {
            type = type === 'full' ? 'full' : '';
            _startBackup.apply(this, [type]);
        };

        /**
         * Starts a backup
         * @param type
         */
        this.startBackup = function(type)
        {
            _startBackup.apply(this, [type]);
        };

        /**
         * Starts a backup task - may be triggered by the user, or scheduled
         * @param type
         */
        var _startBackup = function(type)
        {
            duplicityHelper.doBackup(backupData.options, type, function(has_error)
            {
                eventEmitter.emit('backup-end', backupID, has_error);
            });
        };

        /**
         * Deletes backup
         */
        this.deleteBackup = function()
        {
            configHelper.deleteSync(function(has_error)
            {
                eventEmitter.emit('backup-deleted', backupID, has_error);
            });
        };

        /**
         * Restores a file
         * @param path
         * @param destination_path
         */
        this.restoreFile = function(path, destination_path)
        {
            duplicityHelper.restoreFile(backupData.options, path, destination_path, function()
            {
                eventEmitter.emit('file-restored', backupID);
            });
        };

        /**
         * Restore all files
         * @param destination_path
         */
        this.restoreTree = function(destination_path)
        {
            duplicityHelper.restoreTree(backupData.options, destination_path, function()
            {
                eventEmitter.emit('tree-restored', backupID);
            });
        };

        /**
         * Triggers a scheduled event
         * @param type
         */
        var _onScheduledEvent = function(type)
        {
            eventEmitter.emit('scheduled-backup', backupID, type);
        };

        /**
         * Stores temporarily CLI output in a buffer to delay view update (otherwise UI would become unresponsive)
         * @param output
         */
        var _onDuplicityOutput = function(output)
        {
            outputBuffer += output;
        };

        /**
         * Sends output buffer
         */
        var _sendOutput = function()
        {
            if (outputBuffer !== '')
            {
                eventEmitter.emit('backup-history', backupID, outputBuffer);
                outputBuffer = '';
            }
        };

    };

    m.exports = module;

})(module, require);