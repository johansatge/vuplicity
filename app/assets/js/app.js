/**
 * App bootstrap
 */
(function(process, require, js_path)
{

    'use strict';

    var appPath = js_path.replace(/\/assets\/js$/, '');

    var fs = require('fs');
    var app = require('app');
    var crash_reporter = require('crash-reporter');
    var ipc = require('ipc');
    var dialog = require('dialog');
    var util = require('util');
    var moment = require('moment');
    var Duplicity = require(appPath + '/assets/js/utils/duplicity.js');
    var CustomTray = require(appPath + '/assets/js/utils/customtray.js');
    var WindowRenderer = require(appPath + '/assets/js/utils/windowrenderer.js');
    var Configuration = require(appPath + '/assets/js/utils/configuration.js');

    var controlPanelWindow = null;
    var config = null;
    var duplicityHelpers = {};
    var tray = null;

    /**
     * Inits the main controller when the electron app is ready
     */
    var _onAppReady = function()
    {
        if (typeof app.dock !== 'undefined')
        {
            app.dock.hide();
        }
        var config_path = process.env[process.platform !== 'win32' ? 'HOME' : 'USERPROFILE'].replace(/\/$/, '') + '/.vuplicity';
        config = new Configuration(config_path);
        _initTray.apply(this);
        _initControlPanel.apply(this);
        _initIPC.apply(this);
        _onControlPanelShow.apply(this);
    };

    /**
     * Inits control panel
     */
    var _initControlPanel = function()
    {
        controlPanelWindow = new WindowRenderer();
        controlPanelWindow.load('file://' + appPath + '/assets/html/controlpanel.html');
    };

    /**
     * Inits main tray
     */
    var _initTray = function()
    {
        var label = app.getName() + ' ' + app.getVersion();
        tray = new CustomTray(label, appPath + '/assets/css/images', _onControlPanelShow.bind(this), _onQuitFromTray.bind(this));
    };

    /**
     * Inits IPC events
     */
    var _initIPC = function()
    {
        ipc.on('control-panel-ready', _onControlPanelReady.bind(this));
        ipc.on('request-backup-deletion', _onRequestBackupDeletion.bind(this));
        ipc.on('select-directory', _onSelectBackupDirectory.bind(this));
        ipc.on('refresh-file-tree', _onRefreshBackupFileTree.bind(this));
        ipc.on('refresh-status', _onRefreshBackupStatus.bind(this));
        ipc.on('save-settings', _onSaveBackupSettings.bind(this));
        ipc.on('cancel-process', _onCancelBackupProcess.bind(this));
        ipc.on('restore-file', _onRestoreBackupFile.bind(this));
        ipc.on('restore-all', _onRestoreBackupTree.bind(this));
        ipc.on('start-backup', _onStartBackup.bind(this));
    };

    /**
     * Sends the current configuration to the control panel when it has been opened
     */
    var _onControlPanelReady = function()
    {
        var backups = config.getBackups();
        for (var index in backups)
        {
            duplicityHelpers[index] = new Duplicity();
            controlPanelWindow.send('set-backup-options', index, backups[index], false);
        }
    };

    /**
     * Cancels the current process of a backup
     * @param evt
     * @param backup_id
     */
    var _onCancelBackupProcess = function(evt, backup_id)
    {
        duplicityHelpers[backup_id].cancel();
    };

    /**
     * Starts a backup task
     * @param evt
     * @param backup_id
     */
    var _onStartBackup = function(evt, backup_id)
    {
        var params = {
            type: 'info',
            message: 'What task do you want to start ?',
            buttons: ['Automatic backup', 'Full backup']
        };
        dialog.showMessageBox(controlPanelWindow.getWindow(), params, function(response)
        {
            _setBackupUI.apply(this, [backup_id, 'processing', 'Backup in progress...']);
            duplicityHelpers[backup_id].doBackup(config.getBackupData(backup_id), (response === 0 ? '' : 'full'), function(error, status)
            {
                controlPanelWindow.send('set-backup-status', backup_id, status);
                _setBackupUI.apply(this, [backup_id, 'idle', error ? error : 'Backup done.']);
                if (!error)
                {
                    _onRefreshBackupStatus.apply(this, [null, backup_id]);
                }
            });
        });
    };

    /**
     * Opens a file dialog to select a backup dir from the control panel
     * @param evt
     * @param backup_id
     */
    var _onSelectBackupDirectory = function(evt, backup_id)
    {
        dialog.showOpenDialog(controlPanelWindow.getWindow(), {title: 'Select directory', properties: ['openDirectory']}, function(paths)
        {
            if (typeof paths !== 'undefined')
            {
                controlPanelWindow.send('directory-selected', paths[0], backup_id);
            }
        });
    };

    /**
     * Request the deletion of a backup from the control panel
     * @param evt
     * @param backup_id
     */
    var _onRequestBackupDeletion = function(evt, backup_id)
    {
        var params = {
            type: 'warning',
            message: 'Do you want to delete this backup ?',
            detail: 'The entry will be removed.\nNothing will be modified on the remote server.',
            buttons: ['Delete', 'Cancel']
        };
        dialog.showMessageBox(controlPanelWindow.getWindow(), params, function(response)
        {
            if (response === 0)
            {
                if (config.deleteBackup(backup_id))
                {
                    controlPanelWindow.send('confirm-backup-deletion', backup_id);
                    delete duplicityHelpers[backup_id];
                }
                else
                {
                    dialog.showErrorBox('The settings could not be written.', 'Please check that the app can write in the file and retry.');
                }
            }
        });
    };

    /**
     * Gets the status of a backup
     * @param evt
     * @param backup_id
     */
    var _onRefreshBackupStatus = function(evt, backup_id)
    {
        _setBackupUI.apply(this, [backup_id, 'processing', 'Refreshing status...']);
        duplicityHelpers[backup_id].getStatus(config.getBackupData(backup_id), function(error, status)
        {
            controlPanelWindow.send('set-backup-status', backup_id, status);
            _setBackupUI.apply(this, [backup_id, 'idle', error ? error : 'Status updated.']);
        });
    };

    /**
     * Gets the file tree of a backup
     * @param evt
     * @param backup_id
     */
    var _onRefreshBackupFileTree = function(evt, backup_id)
    {
        _setBackupUI.apply(this, [backup_id, 'processing', 'Refreshing file tree...']);
        duplicityHelpers[backup_id].getFiles(config.getBackupData(backup_id), function(error, tree)
        {
            controlPanelWindow.send('set-backup-file-tree', backup_id, tree);
            _setBackupUI.apply(this, [backup_id, 'idle', error ? error : 'Files refreshed.']);
        });
    };

    /**
     * Saves the options of a backup
     * @param evt
     * @param backup_id
     * @param backup_data
     */
    var _onSaveBackupSettings = function(evt, backup_id, backup_data)
    {
        _setBackupUI.apply(this, [backup_id, 'processing', 'Saving settings...']);
        config.updateBackup(backup_id, backup_data, function(error)
        {
            _setBackupUI.apply(this, [backup_id, 'idle', error ? error : 'Settings saved.']);
            if (error === false)
            {
                controlPanelWindow.send('set-backup-options', backup_id, backup_data, false);
            }
        });
    };

    /**
     * Restores the file of a backup
     * @param evt
     * @param backup_id
     * @param path
     */
    var _onRestoreBackupFile = function(evt, backup_id, path)
    {
        var backup_data = config.getBackupData(backup_id);
        var params = {
            title: 'Select the restore destination',
            defaultPath: backup_data.path
        };
        dialog.showSaveDialog(controlPanelWindow.getWindow(), params, function(destination_path)
        {
            if (typeof destination_path !== 'undefined')
            {
                _setBackupUI.apply(this, [backup_id, 'processing', 'Restoring file...']);
                duplicityHelpers[backup_id].restoreFile(backup_data, path, destination_path, function(error)
                {
                    _setBackupUI.apply(this, [backup_id, 'idle', error ? error : 'File restored.']);
                });
            }
        });
    };

    /**
     * Restores a backup
     * @param evt
     * @param backup_id
     */
    var _onRestoreBackupTree = function(evt, backup_id)
    {
        var backup_data = config.getBackupData(backup_id);
        var params = {
            title: 'Select the restore destination',
            defaultPath: backup_data.path,
            properties: ['openDirectory', 'createDirectory']
        };
        dialog.showOpenDialog(controlPanelWindow.getWindow(), params, function(destination_path)
        {
            if (typeof destination_path !== 'undefined')
            {
                _setBackupUI.apply(this, [backup_id, 'processing', 'Restoring all files...']);
                duplicityHelpers[backup_id].restoreTree(backup_data, destination_path, function(error)
                {
                    _setBackupUI.apply(this, [backup_id, 'idle', error ? error : 'Backup tree restored.']);
                });
            }
        });
    };

    /**
     * Updates backup UI when doing tasks
     * @param backup_id
     * @param state
     * @param message
     */
    var _setBackupUI = function(backup_id, state, message)
    {
        tray[state === 'processing' ? 'setProcessing' : 'setIdle']();
        controlPanelWindow.send('set-backup-ui', backup_id, state, message);
        message = moment().format('YYYY-MM-DD HH:mm:ss') + '\n' + message;
        controlPanelWindow.send('set-backup-history', backup_id, message);
    };

    /**
     * Displays the control panel
     */
    var _onControlPanelShow = function()
    {
        controlPanelWindow.makeVisible();
    };

    /**
     * Do not quit when all windows are closed
     * @param evt
     */
    var _onBeforeQuit = function(evt)
    {
        evt.preventDefault();
    };

    /**
     * Quits the app from the tray
     */
    var _onQuitFromTray = function()
    {
        app.removeListener('before-quit', _onBeforeQuit);
        app.quit();
    };

    crash_reporter.start();
    app.on('ready', _onAppReady.bind(this));
    app.on('before-quit', _onBeforeQuit.bind(this));

})(process, require, __dirname);