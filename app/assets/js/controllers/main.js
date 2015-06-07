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
            glob.sync(configPath.replace('%s', '*'), {}).map(function(path, index)
            {
                _registerBackup(index, path, false);
            });
        });
        ipc.on('create-backup', function()
        {
            var id = new Date().getTime();
            _registerBackup(id, configPath.replace('%s', id), true);
        });
        ipc.on('cancel-process', function(evt, id)
        {
            backups[id].cancelProcess();
        });
        ipc.on('select-backup-path', function(evt, id)
        {
            backups[id].selectBackupPath(controlPanelWindow.getWindow());
        });
        ipc.on('refresh-status', function(evt, id)
        {
            backups[id].refreshBackupStatus();
        });
        ipc.on('refresh-file-tree', function(evt, id)
        {
            backups[id].refreshBackupTree();
        });
        ipc.on('restore-file', function(evt, id, path)
        {
            backups[id].restoreFile(path, controlPanelWindow.getWindow());
        });
        ipc.on('restore-tree', function(evt, id)
        {
            backups[id].restoreTree(controlPanelWindow.getWindow());
        });
        ipc.on('start-backup', function(evt, id)
        {
            backups[id].startBackup(controlPanelWindow.getWindow());
        });
        ipc.on('delete-backup', function(evt, id)
        {
            backups[id].deleteBackup(controlPanelWindow.getWindow());
        });
        ipc.on('save-backup', function(evt, id, options, schedules)
        {
            backups[id].saveBackupData(options, schedules);
        });
    };

    /**
     * Model events (answers from processes launched by the view & scheduled tasks)
     */
    var _handleModelEvents = function()
    {
        emitter.on('scheduled-backup', function(id, type)
        {
            backups[id].startScheduledBackup(controlPanelWindow.getWindow(), type);
        });
        emitter.on('cli-output', function(id, output)
        {
            controlPanelWindow.send('set-backup-history', id, output);
        });
        emitter.on('backup-path-selected', function(id, path)
        {
            controlPanelWindow.send('set-backup-path', path, id);
        });
        emitter.on('status-refreshed', function(id, status)
        {
            controlPanelWindow.send('set-backup-status', id, status);
        });
        emitter.on('file-tree-refreshed', function(id, tree)
        {
            controlPanelWindow.send('set-backup-file-tree', id, tree);
        });
        emitter.on('backup-saved', function(id, options, schedules)
        {
            controlPanelWindow.send('set-backup-data', id, options, schedules, false);
        });
        emitter.on('backup-deleted', function(id)
        {
            controlPanelWindow.send('confirm-backup-deletion', id);
            delete backups[id];
        });
        emitter.on('ui-processing', function(id, message)
        {
            appTray.setProcessing();
            controlPanelWindow.send('set-backup-ui', id, 'processing', message);
            controlPanelWindow.send('set-backup-history', id, moment().format('YYYY-MM-DD HH:mm:ss') + '\n' + message);
        });
        emitter.on('ui-idle', function(id, message)
        {
            appTray.setIdle();
            controlPanelWindow.send('set-backup-ui', id, 'idle', message);
            controlPanelWindow.send('set-backup-history', id, moment().format('YYYY-MM-DD HH:mm:ss') + '\n' + message);
        });
    };

    /**
     * Registers a backup item (model & view)
     * @param id
     * @param path
     * @param is_opened
     */
    var _registerBackup = function(id, path, is_opened)
    {
        backups[id] = new Backup();
        var data = backups[id].init(id, path, emitter);
        controlPanelWindow.send('set-backup-data', id, data.options, data.schedules, is_opened);
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