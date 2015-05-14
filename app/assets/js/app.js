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
    var Duplicity = require(appPath + '/assets/js/utils/duplicity.js');
    var Tray = require(appPath + '/assets/js/utils/tray.js');
    var WindowRenderer = require(appPath + '/assets/js/utils/windowrenderer.js');
    var Configuration = require(appPath + '/assets/js/utils/configuration.js');

    var controlPanelWindow = null;
    var config = null;
    var duplicityHelpers = {};

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
        var tray_icon = appPath + '/assets/css/images/tray.png';
        var tray = new Tray(tray_label, tray_icon, _onControlPanelShow.bind(this), _onQuitFromTray.bind(this));
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
                evt.sender.send('set-backup-options', index, backups[index], false);
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
                evt.sender.send('directory-selected', paths[0], backup_id);
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
                    evt.sender.send('confirm-backup-deletion', backup_id);
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
        controlPanelWindow.send('set-backup-ui', backup_id, 'processing');
        var backup_data = config.getBackupData(backup_id);
        duplicityHelpers[backup_id] = new Duplicity();
        duplicityHelpers[backup_id].getStatus(backup_data, function(error, status)
        {
            controlPanelWindow.send('set-backup-status', backup_id, status);
            controlPanelWindow.send('set-backup-error', backup_id, error);
            controlPanelWindow.send('set-backup-ui', backup_id, 'idle');
            delete duplicityHelpers[backup_id];
        });
    };

    /**
     * Gets the file tree of a backup
     * @param evt
     * @param backup_id
     */
    var _onRefreshBackupFileTree = function(evt, backup_id)
    {
        controlPanelWindow.send('set-backup-ui', backup_id, 'processing');
        var backup_data = config.getBackupData(backup_id);
        duplicityHelpers[backup_id] = new Duplicity();
        duplicityHelpers[backup_id].getFiles(backup_data, function(error, tree)
        {
            controlPanelWindow.send('set-backup-file-tree', backup_id, tree);
            controlPanelWindow.send('set-backup-error', backup_id, error);
            controlPanelWindow.send('set-backup-ui', backup_id, 'idle');
            delete duplicityHelpers[backup_id];
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
        controlPanelWindow.send('set-backup-ui', backup_id, 'processing');
        if (config.updateBackup(backup_id, backup_data)) // @todo make async
        {
            controlPanelWindow.send('set-backup-ui', backup_id, 'idle');
        }
        else
        {
            dialog.showErrorBox('The settings could not be written.', 'Please check that the app can write in the file and retry.');
            controlPanelWindow.send('set-backup-ui', backup_id, 'idle');
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
            var backup_data = config.getBackupData(backup_id);
            controlPanelWindow.send('set-backup-ui', backup_id, 'processing');
            duplicityHelpers[backup_id] = new Duplicity();
            duplicityHelpers[backup_id].restoreFile(backup_data, path, destination_path, function(error)
            {
                controlPanelWindow.send('set-backup-error', backup_id, error);
                controlPanelWindow.send('set-backup-ui', backup_id, 'idle');
                // @todo return message ?
            });
        });
    };

    /**
     * Restores a backup
     * @param evt
     * @param backup_id
     */
    var _onRestoreBackupTree = function(evt, backup_id)
    {
        console.log('@todo task');
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