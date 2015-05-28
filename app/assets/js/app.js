/**
 * App bootstrap
 */
(function(require, js_path)
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
        config = new Configuration('/Users/johan/.vuplicity');
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
        var tray_label = app.getName() + ' ' + app.getVersion();
        var idle_icon = {
            normal: appPath + '/assets/css/images/tray.png',
            pressed: appPath + '/assets/css/images/tray_pressed.png'
        };
        var process_icon = {
            normal: appPath + '/assets/css/images/tray_process.png',
            pressed: appPath + '/assets/css/images/tray_process_pressed.png'
        };
        tray = new CustomTray(tray_label, idle_icon, process_icon, _onControlPanelShow.bind(this), _onQuitFromTray.bind(this));
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
        ipc.on('window-move', _onWindowMove.bind(this));
        ipc.on('window-close', _onWindowClose.bind(this));
    };

    /**
     * Sends the current configuration to the control panel when it has been opened
     * @param evt
     */
    var _onControlPanelReady = function(evt)
    {
        var backups = config.getBackups();
        if (backups !== false)
        {
            for (var index in backups)
            {
                controlPanelWindow.send('set-backup-options', index, backups[index], false);
            }
        }
        else
        {
            dialog.showErrorBox('The configuration file was not read correctly.', 'Please check its syntax and restart the app.');
        }
    };

    /**
     * Cancels the current process of a backup
     * @param evt
     * @param backup_id
     */
    var _onCancelBackupProcess = function(evt, backup_id)
    {
        if (typeof duplicityHelpers[backup_id] !== 'undefined')
        {
            duplicityHelpers[backup_id].cancel();
        }
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
            detail: '@todo help message.',
            buttons: ['Automatic backup', 'Full backup']
        };
        dialog.showMessageBox(controlPanelWindow.getWindow(), params, function(response)
        {
            tray.setProcessing();
            controlPanelWindow.send('set-backup-ui', backup_id, 'processing', 'Backup in progress...');
            _updateBackupHistory.apply(this, [backup_id, 'Backup in progress...']);
            var backup_data = config.getBackupData(backup_id);
            duplicityHelpers[backup_id] = new Duplicity();
            var type = response === 0 ? '' : 'full';
            duplicityHelpers[backup_id].doBackup(backup_data, type, function(error, status)
            {
                controlPanelWindow.send('set-backup-status', backup_id, status);
                _updateBackupHistory.apply(this, [backup_id, error ? error : 'Backup done.']);
                controlPanelWindow.send('set-backup-ui', backup_id, 'idle', '', error);
                delete duplicityHelpers[backup_id];
                tray.setIdle();
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
        tray.setProcessing();
        controlPanelWindow.send('set-backup-ui', backup_id, 'processing', 'Refreshing status...');
        _updateBackupHistory.apply(this, [backup_id, 'Refreshing status...']);
        var backup_data = config.getBackupData(backup_id);
        duplicityHelpers[backup_id] = new Duplicity();
        duplicityHelpers[backup_id].getStatus(backup_data, function(error, status)
        {
            controlPanelWindow.send('set-backup-status', backup_id, status);
            _updateBackupHistory.apply(this, [backup_id, error ? error : 'Status updated.']);
            controlPanelWindow.send('set-backup-ui', backup_id, 'idle', '', error);
            delete duplicityHelpers[backup_id];
            tray.setIdle();
        });
    };

    /**
     * Gets the file tree of a backup
     * @param evt
     * @param backup_id
     */
    var _onRefreshBackupFileTree = function(evt, backup_id)
    {
        tray.setProcessing();
        controlPanelWindow.send('set-backup-ui', backup_id, 'processing', 'Refreshing file tree...');
        _updateBackupHistory.apply(this, [backup_id, 'Refreshing file tree...']);
        var backup_data = config.getBackupData(backup_id);
        duplicityHelpers[backup_id] = new Duplicity();
        duplicityHelpers[backup_id].getFiles(backup_data, function(error, tree)
        {
            controlPanelWindow.send('set-backup-file-tree', backup_id, tree);
            _updateBackupHistory.apply(this, [backup_id, error ? error : 'Files refreshed.']);
            controlPanelWindow.send('set-backup-ui', backup_id, 'idle', '', error);
            delete duplicityHelpers[backup_id];
            tray.setIdle();
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
        tray.setProcessing();
        controlPanelWindow.send('set-backup-ui', backup_id, 'processing', 'Saving settings...');
        _updateBackupHistory.apply(this, [backup_id, 'Saving settings...']);
        if (config.updateBackup(backup_id, backup_data)) // @todo make async
        {
            controlPanelWindow.send('set-backup-ui', backup_id, 'idle', '', false);
            _updateBackupHistory.apply(this, [backup_id, 'Settings saved.']);
            controlPanelWindow.send('set-backup-options', backup_id, backup_data, false);
        }
        else
        {
            _updateBackupHistory.apply(this, [backup_id, 'Settings could not be written.']);
            controlPanelWindow.send('set-backup-ui', backup_id, 'idle', '', true);
            delete duplicityHelpers[backup_id];
        }
    };

    /**
     * Restores the file of a backup
     * @param evt
     * @param backup_id
     * @param path
     */
    var _onRestoreBackupFile = function(evt, backup_id, path)
    {
        var params = {
            title: 'Select the restore destination',
            defaultPath: '/Users/johan/Desktop' // @todo select current file path, if available
        };
        dialog.showSaveDialog(controlPanelWindow.getWindow(), params, function(destination_path)
        {
            if (typeof destination_path === 'undefined')
            {
                return;
            }
            tray.setProcessing();
            var backup_data = config.getBackupData(backup_id);
            controlPanelWindow.send('set-backup-ui', backup_id, 'processing', 'Restoring file...');
            _updateBackupHistory.apply(this, [backup_id, 'Restoring file...']);
            duplicityHelpers[backup_id] = new Duplicity();
            duplicityHelpers[backup_id].restoreFile(backup_data, path, destination_path, function(error)
            {
                _updateBackupHistory.apply(this, [backup_id, error ? error : 'File restored.']);
                controlPanelWindow.send('set-backup-ui', backup_id, 'idle', '', error);
            });
            tray.setIdle();
        });
    };

    /**
     * Sends a history update to the view
     * @param backup_id
     * @param message
     */
    var _updateBackupHistory = function(backup_id, message)
    {
        message = moment().format('YYYY-MM-DD HH:mm:ss') + '\n' + message;
        controlPanelWindow.send('set-backup-history', backup_id, message);
    };

    /**
     * Restores a backup
     * @param evt
     * @param backup_id
     */
    var _onRestoreBackupTree = function(evt, backup_id)
    {
        var params = {
            title: 'Select the restore destination',
            defaultPath: '/Users/johan/Desktop', // @todo select backup path, if available
            properties: ['openDirectory', 'createDirectory']
        };
        dialog.showOpenDialog(controlPanelWindow.getWindow(), params, function(destination_path)
        {
            if (typeof destination_path === 'undefined')
            {
                return;
            }
            tray.setProcessing();
            var backup_data = config.getBackupData(backup_id);
            controlPanelWindow.send('set-backup-ui', backup_id, 'processing', 'Restoring backup tree...');
            _updateBackupHistory.apply(this, [backup_id, 'Restoring all files...']);
            duplicityHelpers[backup_id] = new Duplicity();
            duplicityHelpers[backup_id].restoreTree(backup_data, destination_path, function(error)
            {
                _updateBackupHistory.apply(this, [backup_id, error ? error : 'Backup tree restored.']);
                controlPanelWindow.send('set-backup-ui', backup_id, 'idle', '', error);
                tray.setIdle();
            });
        });
    };

    /**
     * Moves the control panel
     */
    var _onWindowMove = function(evt, x, y)
    {
        controlPanelWindow.setPosition(x, y);
    };

    /**
     * Closes the control panel
     */
    var _onWindowClose = function()
    {
        controlPanelWindow.hide();
    };

    /**
     * Creates the settings window
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
     * Quits the app from the tray item
     */
    var _onQuitFromTray = function()
    {
        app.removeListener('before-quit', _onBeforeQuit);
        app.quit();
    };

    crash_reporter.start();
    app.on('ready', _onAppReady);
    app.on('before-quit', _onBeforeQuit);

})(require, __dirname);