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
    var backupsHistory = {};
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

        setInterval(_sendBackupsHistory.bind(this), 1000);
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
            _setUI.apply(this, [id, 'processing', 'Refreshing status...']);
            backups[id].refreshBackupStatus();
        });
        ipc.on('refresh-file-tree', function(evt, id)
        {
            _setUI.apply(this, [id, 'processing', 'Refreshing file tree...']);
            backups[id].refreshBackupTree();
        });
        ipc.on('restore-file', function(evt, id, path)
        {
            ControlPanelDialogs.selectRestoreFileDestination(function(destination_path)
            {
                _setUI.apply(this, [id, 'processing', 'Restoring file...']);
                backups[id].restoreFile(path, destination_path);
            });
        });
        ipc.on('restore-tree', function(evt, id)
        {
            ControlPanelDialogs.selectRestoreTreeDestination(function(destination_path)
            {
                _setUI.apply(this, [id, 'processing', 'Restoring files...']);
                backups[id].restoreTree(destination_path);
            });
        });
        ipc.on('start-backup', function(evt, id)
        {
            ControlPanelDialogs.confirmStartBackup(function(type)
            {
                _setUI.apply(this, [id, 'processing', 'Starting backup...']);
                backups[id].startBackup(type);
            });
        });
        ipc.on('delete-backup', function(evt, id)
        {
            ControlPanelDialogs.confirmDeleteBackup(function()
            {
                _setUI.apply(this, [id, 'processing', 'Deleting backup...']);
                backups[id].deleteBackup(controlPanelWindow.getWindow());
            });
        });
        ipc.on('save-backup', function(evt, id, options, schedules)
        {
            _setUI.apply(this, [id, 'processing', 'Saving settings...']);
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
            backupsHistory[id] += output;
        });
        emitter.on('status-refreshed', function(id, has_error, status)
        {
            _setUI.apply(this, [id, 'idle', has_error ? 'A Duplicity error occurred.' : 'Status refreshed.']);
            controlPanelWindow.send('set-backup-status', id, status);
        });
        emitter.on('file-tree-refreshed', function(id, has_error, tree)
        {
            _setUI.apply(this, [id, 'idle', has_error ? 'A Duplicity error occurred.' : 'File tree refreshed.']);
            controlPanelWindow.send('set-backup-file-tree', id, tree);
        });
        emitter.on('file-restored', function(id, has_error)
        {
            _setUI.apply(this, [id, 'idle', has_error ? 'A Duplicity error occurred.' : 'File restored.']);
        });
        emitter.on('tree-restored', function(id, has_error)
        {
            _setUI.apply(this, [id, 'idle', has_error ? 'A Duplicity error occurred.' : 'Files restored.']);
        });
        emitter.on('backup-end', function(id, has_error)
        {
            if (!has_error)
            {
                backups[id].refreshBackupStatus();
            }
            else
            {
                _setUI.apply(this, [id, 'idle', 'A Duplicity error occurred.']);
            }
        });
        emitter.on('backup-saved', function(id, error, options, schedules)
        {
            _setUI.apply(this, [id, 'idle', error ? error : 'Settings saved.']);
            if (!error)
            {
                controlPanelWindow.send('set-backup-data', id, options, schedules, false);
            }
        });
        emitter.on('backup-deleted', function(id, error)
        {
            if (!error)
            {
                controlPanelWindow.send('confirm-backup-deletion', id);
                delete backups[id];
            }
            _setUI.apply(this, [id, 'idle', error ? error : 'Backup deleted.']);
        });
    };

    /**
     * Regularly update the view with backups history
     */
    var _sendBackupsHistory = function()
    {
        for (var id in backupsHistory)
        {
            if (backupsHistory[id] !== '')
            {
                controlPanelWindow.send('set-backup-history', id, backupsHistory[id]);
                backupsHistory[id] = '';
            }
        }
    };

    /**
     * Sets UI status (processing or idle)
     * @param id
     * @param status
     * @param message
     */
    var _setUI = function(id, status, message)
    {
        (status === 'processing' ? appTray.setProcessing : appTray.setIdle)();
        controlPanelWindow.send('set-backup-ui', id, status);
        var delimiter = new Array(message.length + 1).join('-') + '\n';
        backupsHistory[id] += delimiter + message + '\n' + delimiter;
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
        backupsHistory[id] = '';
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