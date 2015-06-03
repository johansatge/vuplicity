/**
 * Main controller
 */
(function(m, require, __dirname)
{

    'use strict';

    var ipc = require('ipc');
    var events = require('events');
    var moment = require('moment');
    var dialog = require('dialog');
    var glob = require('glob');
    var WindowRenderer = require(__dirname + '/../utils/windowrenderer.js');
    var Backup = require(__dirname + '/../models/backup.js');

    var module = {};

    var appTray = null;
    var configPath = null;
    var controlPanelWindow = null;
    var backups = {};
    var emitter = new events.EventEmitter();

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
        configPath = config_path;
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
            var files = glob.sync(configPath + '/backup-*.json', {});
            for (var index = 0; index < files.length; index += 1)
            {
                var id = files[index].substr(files[index].lastIndexOf('/') + 1);
                backups[id] = new Backup();
                var data = backups[id].init(id, files[index], emitter);
                controlPanelWindow.send('set-backup-options', id, data, false);
            }
        });
        ipc.on('select-directory', function(evt, backup_id)
        {
            backups[backup_id].selectDirectory(controlPanelWindow.getWindow());
        });
        emitter.on('directory-selected', function(backup_id, path)
        {
            controlPanelWindow.send('set-backup-path', path, backup_id);
        });
        ipc.on('cancel-process', function(evt, backup_id)
        {
            backups[backup_id].cancelProcess();
        });
        emitter.on('cli-output', function(backup_id, output)
        {
            controlPanelWindow.send('set-backup-history', backup_id, output);
        });
        emitter.on('ui-processing', function(backup_id, message)
        {
            appTray.setProcessing();
            controlPanelWindow.send('set-backup-ui', backup_id, 'processing', message);
            controlPanelWindow.send('set-backup-history', backup_id, moment().format('YYYY-MM-DD HH:mm:ss') + '\n' + message);
        });
        emitter.on('ui-idle', function(backup_id, message)
        {
            appTray.setIdle();
            controlPanelWindow.send('set-backup-ui', backup_id, 'idle', message);
            controlPanelWindow.send('set-backup-history', backup_id, moment().format('YYYY-MM-DD HH:mm:ss') + '\n' + message);
        });
    };

    /**
     * Status events (refresh)
     */
    var _handleStatusEvents = function()
    {
        ipc.on('refresh-status', function(evt, backup_id)
        {
            backups[backup_id].refreshBackupStatus();
        });
        emitter.on('status-refreshed', function(backup_id, error, status)
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
            backups[backup_id].refreshBackupTree();
        });
        emitter.on('file-tree-refreshed', function(backup_id, error, tree)
        {
            controlPanelWindow.send('set-backup-file-tree', backup_id, tree);
        });
        ipc.on('restore-file', function(evt, backup_id, path)
        {
            backups[backup_id].restoreFile(path, controlPanelWindow.getWindow());
        });
        ipc.on('restore-tree', function(evt, backup_id)
        {
            backups[backup_id].restoreTree(controlPanelWindow.getWindow());
        });
    };

    /**
     * Backup events
     */
    var _handleBackupEvents = function()
    {
        ipc.on('start-backup', function(evt, backup_id)
        {
            backups[backup_id].startBackup(controlPanelWindow.getWindow());
        });
        ipc.on('request-backup-deletion', function(evt, backup_id)
        {
            backups[backup_id].deleteBackup(controlPanelWindow.getWindow());
        });
        emitter.on('backup-deleted', function(backup_id)
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
            backups[backup_id].saveBackupSettings(backup_data);
        });
        emitter.on('backup-saved', function(backup_id, backup_data)
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

})(module, require, __dirname);