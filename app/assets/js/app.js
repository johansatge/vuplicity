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
        ipc.on('refresh-backup', _onSaveAndRefreshBackup.bind(this));
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
     * Saves and updates the status of a backup
     * @param evt
     * @param backup_id
     * @param backup_data
     */
    var _onSaveAndRefreshBackup = function(evt, backup_id, backup_data)
    {
        controlPanelWindow.send('backup-process-status', backup_id, true);
        if (config.updateBackup(backup_id, backup_data))
        {
            controlPanelWindow.send('set-backup-options', backup_id, backup_data);
            var helper = new Duplicity();
            helper.getStatus(backup_data.url, backup_data.passphrase, function(error, status)
            {
                controlPanelWindow.send('set-backup-status', backup_id, status);
                controlPanelWindow.send('set-backup-error', backup_id, error);
                controlPanelWindow.send('backup-process-status', backup_id, false);
            });


            //helper.getFiles(backup_data.url, backup_data.passphrase);
            // @todo send with IPC: "set-backup-tree"

        }
        else
        {
            dialog.showErrorBox('The settings could not be written.', 'Please check that the app can write in the file and retry.');
            controlPanelWindow.send('backup-process-status', backup_id, false);
        }
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