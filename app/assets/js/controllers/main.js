/**
 * Main controller
 * Manages communication between the control panel and the backup models
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

        _handleViewEvents.apply(this);
        _handleModelEvents.apply(this);
    };

    /**
     * View events (user interactions & requests coming from the UI)
     */
    var _handleViewEvents = function()
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
        ipc.on('cancel-process', function(evt, backup_id)
        {
            backups[backup_id].cancelProcess();
        });
        ipc.on('select-backup-path', function(evt, backup_id)
        {
            backups[backup_id].selectBackupPath(controlPanelWindow.getWindow());
        });
        ipc.on('refresh-status', function(evt, backup_id)
        {
            backups[backup_id].refreshBackupStatus();
        });
        ipc.on('refresh-file-tree', function(evt, backup_id)
        {
            backups[backup_id].refreshBackupTree();
        });
        ipc.on('restore-file', function(evt, backup_id, path)
        {
            backups[backup_id].restoreFile(path, controlPanelWindow.getWindow());
        });
        ipc.on('restore-tree', function(evt, backup_id)
        {
            backups[backup_id].restoreTree(controlPanelWindow.getWindow());
        });
        ipc.on('start-backup', function(evt, backup_id)
        {
            backups[backup_id].startBackup(controlPanelWindow.getWindow());
        });
        ipc.on('delete-backup', function(evt, backup_id)
        {
            backups[backup_id].deleteBackup(controlPanelWindow.getWindow());
        });
        ipc.on('save-backup', function(evt, backup_id, backup_data)
        {
            backups[backup_id].saveBackupSettings(backup_data);
        });
    };

    /**
     * Model events (answers from processes launched by the view)
     */
    var _handleModelEvents = function()
    {
        emitter.on('cli-output', function(backup_id, output)
        {
            controlPanelWindow.send('set-backup-history', backup_id, output);
        });
        emitter.on('backup-path-selected', function(backup_id, path)
        {
            controlPanelWindow.send('set-backup-path', path, backup_id);
        });
        emitter.on('status-refreshed', function(backup_id, status)
        {
            controlPanelWindow.send('set-backup-status', backup_id, status);
        });
        emitter.on('file-tree-refreshed', function(backup_id, tree)
        {
            controlPanelWindow.send('set-backup-file-tree', backup_id, tree);
        });
        emitter.on('backup-saved', function(backup_id, backup_data)
        {
            controlPanelWindow.send('set-backup-options', backup_id, backup_data, false);
        });
        emitter.on('backup-deleted', function(backup_id)
        {
            controlPanelWindow.send('confirm-backup-deletion', backup_id);
            delete backups[backup_id];
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
     * Displays the main control panel
     */
    module.showControlPanel = function()
    {
        controlPanelWindow.makeVisible();
    };

    m.exports = module;

})(module, require, __dirname);