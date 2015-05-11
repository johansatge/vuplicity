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

    var controlPanelWindow = null;

    /**
     * Inits the main controller when the electron app is ready
     */
    var _onAppReady = function()
    {
        if (typeof app.dock !== 'undefined')
        {
            app.dock.hide();
        }
        _initTray.apply(this);
        _initIPC.apply(this);
        _onControlPanelToggle.apply(this);
    };

    /**
     * Inits main tray
     */
    var _initTray = function()
    {
        var tray_label = app.getName() + ' ' + app.getVersion();
        var tray_icon = appPath + '/assets/css/images/tray.png';
        var tray = new Tray(tray_label, tray_icon, _onControlPanelToggle.bind(this), _onQuitFromTray.bind(this));
    };

    /**
     * Inits IPC events
     */
    var _initIPC = function()
    {
        ipc.on('control-panel-ready', _onControlPanelReady.bind(this));
        ipc.on('create-backup', _onCreateNewBackup.bind(this));
        ipc.on('request-backup-deletion', _onRequestBackupDeletion.bind(this));
        ipc.on('select-directory', _onSelectBackupDirectory.bind(this));
        ipc.on('refresh-backup', _onRefreshBackup.bind(this));
        ipc.on('window-move', _onWindowMove.bind(this));
        ipc.on('window-close', _onWindowClose.bind(this));
    };

    /**
     * Sends the current configuration to the control panel when it has been opened
     * @param evt
     */
    var _onControlPanelReady = function(evt)
    {
        // @todo get real config file
        var sample_settings = JSON.parse(fs.readFileSync(appPath + '/sample.settings.json', {encoding: 'utf8'}));
        for (var index = 0; index < sample_settings.length; index += 1)
        {
            evt.sender.send('set-backup', sample_settings[index], false);
        }
    };

    /**
     * Creates a new backup from the control panel
     * @param evt
     */
    var _onCreateNewBackup = function(evt)
    {
        // @todo add the item to the config file
        var new_id = 'backup-' + new Date().getTime();
        evt.sender.send('set-backup', {id: new_id}, true);
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
                // @todo remove item from the config file
                evt.sender.send('confirm-backup-deletion', backup_id);
            }
        });
    };

    /**
     * Updates the status of a backup
     * @param evt
     * @param backup_id
     * @param backup_data
     */
    var _onRefreshBackup = function(evt, backup_id, backup_data)
    {
        console.log(backup_id);

        // @todo save data, execute commands, send a "set-backup" command

        var helper = new Duplicity();

        helper.getFiles(backup_data.url);
        helper.getStatus(backup_data.url);
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
        controlPanelWindow.close();
        controlPanelWindow = null;
    };

    /**
     * Creates the settings window
     */
    var _onControlPanelToggle = function()
    {
        if (controlPanelWindow === null)
        {
            controlPanelWindow = new WindowRenderer();
            controlPanelWindow.load('file://' + appPath + '/assets/html/controlpanel.html');
        }
        else
        {
            controlPanelWindow.focus();
        }
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