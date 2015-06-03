/**
 * Main controller
 */
(function(m, require)
{

    'use strict';

    var ipc = require('ipc');
    var moment = require('moment');
    var WindowRenderer = require(__dirname + '/../utils/windowrenderer.js');
    var Model = require(__dirname + '/../models/main.js');

    var module = {};

    var appTray = null;
    var controlPanelWindow = null;

    /**
     * Inits main controller
     * @param panel_path
     * @param config_path
     * @param tray
     */
    module.init = function(panel_path, config_path, tray)
    {
        appTray = tray;
        controlPanelWindow = new WindowRenderer();
        controlPanelWindow.load(panel_path);
        Model.init(config_path);
        _handleStatusEvents.apply(this);
        _handleBackupEvents.apply(this);
        _handleFileTreeEvents.apply(this);
        _handleSettingsEvents.apply(this);
        _handleUIEvents.apply(this);
    };

    /**
     * UI events (initial state of the view, dialogs, CLI activity...)
     */
    var _handleUIEvents = function()
    {
        ipc.on('control-panel-ready', function()
        {
            var backups = Model.initAndGetBackups();
            for (var index in backups)
            {
                controlPanelWindow.send('set-backup-options', index, backups[index], false);
            }
        });
        ipc.on('select-directory', function(evt, backup_id)
        {
            Model.selectBackupDirectory(backup_id, controlPanelWindow.getWindow());
        });
        ipc.on('directory-selected', function(backup_id, path)
        {
            controlPanelWindow.send('set-backup-path', path, backup_id);
        });
        ipc.on('cancel-process', function(evt, backup_id)
        {
            Model.cancelProcess(backup_id);
        });
        Model.on('cli-output', function(backup_id, output)
        {
            controlPanelWindow.send('set-backup-history', backup_id, output);
        });
        Model.on('ui', function(backup_id, state, message)
        {
            appTray[state === 'processing' ? 'setProcessing' : 'setIdle']();
            controlPanelWindow.send('set-backup-ui', backup_id, state, message);
            message = moment().format('YYYY-MM-DD HH:mm:ss') + '\n' + message;
            controlPanelWindow.send('set-backup-history', backup_id, message);
        });
    };

    /**
     * Status events (refresh)
     */
    var _handleStatusEvents = function()
    {
        ipc.on('refresh-status', function(evt, backup_id)
        {
            Model.refreshBackupStatus(backup_id);
        });
        Model.on('status-refreshed', function(backup_id, error, status)
        {
            controlPanelWindow.send('set-backup-status', backup_id, status);
        });
    };

    /**
     * Files events (file tree, restores...)
     */
    var _handleFileTreeEvents = function()
    {
        ipc.on('refresh-file-tree', function(evt, backup_id)
        {
            Model.refreshBackupTree(backup_id);
        });
        Model.on('file-tree-refreshed', function(backup_id, error, tree)
        {
            controlPanelWindow.send('set-backup-file-tree', backup_id, tree);
        });
        ipc.on('restore-file', function(evt, backup_id, path)
        {
            Model.restoreFile(backup_id, path, controlPanelWindow.getWindow());
        });
        ipc.on('restore-tree', function(evt, backup_id)
        {
            Model.restoreTree(backup_id, controlPanelWindow.getWindow());
        });
    };

    /**
     * Backup events
     */
    var _handleBackupEvents = function()
    {
        ipc.on('start-backup', function(evt, backup_id)
        {
            Model.startBackup(backup_id, controlPanelWindow.getWindow());
        });
        ipc.on('request-backup-deletion', function(evt, backup_id)
        {
            Model.deleteBackup(backup_id, controlPanelWindow.getWindow());
        });
        Model.on('backup-deleted', function(backup_id)
        {
            controlPanelWindow.send('confirm-backup-deletion', backup_id);
        });
    };

    /**
     * Settings (& automation) events
     */
    var _handleSettingsEvents = function()
    {
        ipc.on('save-backup', function(evt, backup_id, backup_data)
        {
            Model.saveBackupSettings(backup_id, backup_data);
        });
        Model.on('backup-saved', function(backup_id, backup_data)
        {
            controlPanelWindow.send('set-backup-options', backup_id, backup_data, false);
        });
    };

    /**
     * Displays the main control panel
     */
    module.showControlPanel = function()
    {
        controlPanelWindow.makeVisible();
    };

    m.exports = module;

})(module, require);