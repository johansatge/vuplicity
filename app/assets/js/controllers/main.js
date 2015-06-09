/**
 * Main controller
 * Manages communication between the control panel and the backup models
 */
(function(m, require, __dirname)
{

    'use strict';

    var ipc = require('ipc');
    var events = require('events');
    var dialog = require('dialog');
    var glob = require('glob');
    var WindowRenderer = require(__dirname + '/../utils/windowrenderer.js');
    var Backup = require(__dirname + '/../models/backup.js');
    var ControlPanelDialogs = require(__dirname + '/../views/dialogs.js');

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
        ControlPanelDialogs.setWindow(controlPanelWindow.getWindow());
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
            ControlPanelDialogs.selectBackupPath(function(path)
            {
                controlPanelWindow.send('set-backup-path', path, id);
            });
        });
        ipc.on('refresh-status', function(evt, id)
        {
            _setProcessing.apply(this, [id, 'Refreshing status...']);
            backups[id].refreshBackupStatus();
        });
        ipc.on('refresh-file-tree', function(evt, id)
        {
            _setProcessing.apply(this, [id, 'Refreshing file tree...']);
            backups[id].refreshBackupTree();
        });
        ipc.on('restore-file', function(evt, id, path)
        {
            ControlPanelDialogs.selectRestoreFileDestination(function(destination_path)
            {
                _setProcessing.apply(this, [id, 'Restoring file...']);
                backups[id].restoreFile(path, destination_path);
            });
        });
        ipc.on('restore-tree', function(evt, id)
        {
            ControlPanelDialogs.selectRestoreTreeDestination(function(destination_path)
            {
                _setProcessing.apply(this, [id, 'Restoring all files...']);
                backups[id].restoreTree(destination_path);
            });
        });
        ipc.on('start-backup', function(evt, id)
        {
            ControlPanelDialogs.confirmStartBackup(function(type)
            {
                _setProcessing.apply(this, [id, 'Backup in progress...']);
                backups[id].startBackup(type);
            });
        });
        ipc.on('delete-backup', function(evt, id)
        {
            ControlPanelDialogs.confirmDeleteBackup(function()
            {
                _setProcessing.apply(this, [id, 'Deleting backup...']);
                backups[id].deleteBackup(controlPanelWindow.getWindow());
            });
        });
        ipc.on('save-backup', function(evt, id, options, schedules)
        {
            _setProcessing.apply(this, [id, 'Saving settings...']);
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
            if (!backups[id].isProcessing())
            {
                backups[id].startScheduledBackup(controlPanelWindow.getWindow(), type);
            }
        });
        emitter.on('backup-history', function(id, output)
        {
            controlPanelWindow.send('set-backup-history', id, output);
        });
        emitter.on('status-refreshed', function(id, status)
        {
            _setIdle.apply(this, [id]);
            controlPanelWindow.send('set-backup-status', id, status);
        });
        emitter.on('file-tree-refreshed', function(id, tree)
        {
            _setIdle.apply(this, [id]);
            controlPanelWindow.send('set-backup-file-tree', id, tree);
        });
        emitter.on('file-restored', function(id)
        {
            _setIdle.apply(this, [id]);
        });
        emitter.on('tree-restored', function(id)
        {
            _setIdle.apply(this, [id]);
        });
        emitter.on('backup-end', function(id, has_error)
        {
            if (!has_error)
            {
                backups[id].refreshBackupTree();
            }
            else
            {
                _setIdle.apply(this, [id]);
            }
        });
        emitter.on('backup-saved', function(id, options, schedules)
        {
            _setIdle.apply(this, [id]);
            controlPanelWindow.send('set-backup-data', id, options, schedules, false);
        });
        emitter.on('backup-deleted', function(id, has_error)
        {
            if (!has_error)
            {
                controlPanelWindow.send('confirm-backup-deletion', id);
                delete backups[id];
            }
            _setIdle.apply(this, [id]);
        });
    };

    var _setProcessing = function(id, message)
    {
        appTray.setProcessing();
        controlPanelWindow.send('set-backup-ui', id, 'processing', message);
    };

    var _setIdle = function(id)
    {
        appTray.setIdle();
        controlPanelWindow.send('set-backup-ui', id, 'idle', '');
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