/**
 * Backup model
 * Contains all backup-related actions: status, backup, restore...
 */
(function(m, require)
{

    'use strict';

    var moment = require('moment');
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
        var lastBackupDate = null;

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
            duplicityHelper = new Duplicity(_onDuplicityOutput.bind(this), _onDuplicityProgress.bind(this));
            schedulesHelper = new Schedules(_onScheduledEvent.bind(this));
            schedulesHelper.setSchedules(backupData.schedules);
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
         * Gets the date of the next planned backup
         */
        this.getNextBackupDate = function()
        {
            return schedulesHelper.getNext();
        };

        this.getLastBackupDate = function()
        {
            return lastBackupDate !== null ? moment(lastBackupDate).from(moment()) : 'unknown';
        };

        /**
         * Gets backup status
         */
        this.refreshBackupStatus = function()
        {
            duplicityHelper.getStatus(backupData.options, function(has_error, status)
            {
                if (typeof status.chain_end_time !== 'undefined')
                {
                    lastBackupDate = status.chain_end_time;
                }
                eventEmitter.emit('status-refreshed', backupID, has_error, status);
            });
        };

        /**
         * Gets backup file tree
         */
        this.refreshBackupTree = function()
        {
            duplicityHelper.getFiles(backupData.options, function(has_error, tree)
            {
                eventEmitter.emit('file-tree-refreshed', backupID, has_error, tree);
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
                }
                eventEmitter.emit('backup-saved', backupID, error, backupData.options, backupData.schedules);
            });
        };

        /**
         * Deletes backup
         */
        this.deleteBackup = function()
        {
            configHelper.deleteSync(function(error)
            {
                eventEmitter.emit('backup-deleted', backupID, error);
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
         * Restores a file
         * @param path
         * @param destination_path
         */
        this.restoreFile = function(path, destination_path)
        {
            duplicityHelper.restoreFile(backupData.options, path, destination_path, function(has_error)
            {
                eventEmitter.emit('file-restored', backupID, has_error);
            });
        };

        /**
         * Restore all files
         * @param destination_path
         */
        this.restoreTree = function(destination_path)
        {
            duplicityHelper.restoreTree(backupData.options, destination_path, function(has_error)
            {
                eventEmitter.emit('tree-restored', backupID, has_error);
            });
        };

        var _onScheduledEvent = function(type)
        {
            eventEmitter.emit('scheduled-backup', backupID, type);
        };

        var _onDuplicityOutput = function(output)
        {
            eventEmitter.emit('backup-history', backupID, output);
        };

        var _onDuplicityProgress = function(progress)
        {
            eventEmitter.emit('backup-progress', backupID, Math.round(progress * 100) / 100);
        };

    };

    m.exports = module;

})(module, require);