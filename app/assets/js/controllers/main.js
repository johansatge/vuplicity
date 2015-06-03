/**
 * Main controller
 */
(function(m, require)
{

    'use strict';

    var ipc = require('ipc');
    var dialog = require('dialog');
    var moment = require('moment');
    var WindowRenderer = require(__dirname + '/../utils/windowrenderer.js');
    var Model = require(__dirname + '/../models/main.js');

    var module = {};

    var appTray = null;
    var controlPanelWindow = null;
    var appConfig = null;

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

        ipc.on('control-panel-ready', _onControlPanelReady.bind(this));
        ipc.on('request-backup-deletion', _onRequestBackupDeletion.bind(this));
        Model.on('backup-deleted', _onBackupDeleted.bind(this));
        ipc.on('select-directory', _onSelectBackupDirectory.bind(this));
        ipc.on('cancel-process', _onCancelBackupProcess.bind(this));
        Model.on('cli-output', _onUpdateBackupHistoryFromModel.bind(this));
        ipc.on('refresh-file-tree', _onRefreshBackupFileTree.bind(this));
        Model.on('file-tree-refreshed', _onBackupTreeRefreshed.bind(this));
        ipc.on('refresh-status', _onRefreshBackupStatus.bind(this));
        Model.on('status-refreshed', _onBackupStatusRefreshed.bind(this));
        ipc.on('save-settings', _onSaveBackupSettings.bind(this));
        Model.on('settings-saved', _onBackupSettingsSaved.bind(this));
        ipc.on('restore-file', _onRestoreBackupFile.bind(this));
        Model.on('file-restored', _onBackupFileRestored.bind(this));
        ipc.on('restore-tree', _onRestoreBackupTree.bind(this));
        Model.on('tree-restored', _onBackupTreeRestored.bind(this));
        ipc.on('start-backup', _onStartBackup.bind(this));
        Model.on('backup-done', _onBackupDone.bind(this));
    };

    /**
     * Displays the main control panel
     */
    module.showControlPanel = function()
    {
        controlPanelWindow.makeVisible();
    };

    var _onUpdateBackupHistoryFromModel = function(backup_id, output)
    {
        controlPanelWindow.send('set-backup-history', backup_id, output);
    };

    /**
     * Inits and sends the current configuration to the control panel when it has been opened
     */
    var _onControlPanelReady = function()
    {
        var backups = Model.initAndGetBackups();
        for (var index in backups)
        {
            controlPanelWindow.send('set-backup-options', index, backups[index], false);
        }
    };

    /**
     * Gets the status of a backup
     * @param evt
     * @param backup_id
     */
    var _onRefreshBackupStatus = function(evt, backup_id)
    {
        _setBackupUI.apply(this, [backup_id, 'processing', 'Refreshing status...']);
        Model.refreshBackupStatus(backup_id);
    };

    var _onBackupStatusRefreshed = function(backup_id, error, status)
    {
        controlPanelWindow.send('set-backup-status', backup_id, status);
        _setBackupUI.apply(this, [backup_id, 'idle', error ? error : 'Status updated.']);
    };

    /**
     * Gets the file tree of a backup
     * @param evt
     * @param backup_id
     */
    var _onRefreshBackupFileTree = function(evt, backup_id)
    {
        _setBackupUI.apply(this, [backup_id, 'processing', 'Refreshing file tree...']);
        Model.refreshBackupTree(backup_id);
    };

    var _onBackupTreeRefreshed = function(backup_id, error, tree)
    {
        controlPanelWindow.send('set-backup-file-tree', backup_id, tree);
        _setBackupUI.apply(this, [backup_id, 'idle', error ? error : 'Files refreshed.']);
    };

    /**
     * Saves the options of a backup
     * @param evt
     * @param backup_id
     * @param backup_data
     */
    var _onSaveBackupSettings = function(evt, backup_id, backup_data)
    {
        _setBackupUI.apply(this, [backup_id, 'processing', 'Saving settings...']);
        Model.saveBackupSettings(backup_id, backup_data);
    };

    var _onBackupSettingsSaved = function(backup_id, error, backup_data)
    {
        _setBackupUI.apply(this, [backup_id, 'idle', error ? error : 'Settings saved.']);
        if (error === false)
        {
            controlPanelWindow.send('set-backup-options', backup_id, backup_data, false);
        }
    };

    /**
     * Cancels the current process of a backup
     * @param evt
     * @param backup_id
     */
    var _onCancelBackupProcess = function(evt, backup_id)
    {
        Model.cancelProcess(backup_id);
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
            buttons: ['Automatic backup', 'Full backup']
        };
        dialog.showMessageBox(controlPanelWindow.getWindow(), params, function(response)
        {
            _setBackupUI.apply(this, [backup_id, 'processing', 'Backup in progress...']);
            Model.startBackup(backup_id, (response === 0 ? '' : 'full'));
        });
    };

    var _onBackupDone = function(backup_id, error, status)
    {
        controlPanelWindow.send('set-backup-status', backup_id, status);
        _setBackupUI.apply(this, [backup_id, 'idle', error ? error : 'Backup done.']);
        if (!error)
        {
            _onRefreshBackupStatus.apply(this, [null, backup_id]);
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
                controlPanelWindow.send('set-backup-path', paths[0], backup_id);
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
                _setBackupUI.apply(this, [backup_id, 'processing', 'Deleting backup...']);
                Model.deleteBackup(backup_id);
            }
        });
    };

    var _onBackupDeleted = function(backup_id, error)
    {
        if (error === false)
        {
            controlPanelWindow.send('confirm-backup-deletion', backup_id);
        }
        else
        {
            _setBackupUI.apply(this, [backup_id, 'idle', error]);
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
        var backup_data = appConfig.getBackupData(backup_id);
        var params = {
            title: 'Select the restore destination',
            defaultPath: backup_data.path
        };
        dialog.showSaveDialog(controlPanelWindow.getWindow(), params, function(destination_path)
        {
            if (typeof destination_path !== 'undefined')
            {
                _setBackupUI.apply(this, [backup_id, 'processing', 'Restoring file...']);
                Model.restoreFile(backup_id, path, destination_path);
            }
        });
    };

    var _onBackupFileRestored = function(backup_id, error)
    {
        _setBackupUI.apply(this, [backup_id, 'idle', error ? error : 'File restored.']);
    };

    /**
     * Restores a backup
     * @param evt
     * @param backup_id
     */
    var _onRestoreBackupTree = function(evt, backup_id)
    {
        var backup_data = appConfig.getBackupData(backup_id);
        var params = {
            title: 'Select the restore destination',
            defaultPath: backup_data.path,
            properties: ['openDirectory', 'createDirectory']
        };
        dialog.showOpenDialog(controlPanelWindow.getWindow(), params, function(destination_path)
        {
            if (typeof destination_path !== 'undefined')
            {
                _setBackupUI.apply(this, [backup_id, 'processing', 'Restoring all files...']);
                Model.restoreTree(backup_id, destination_path);
            }
        });
    };

    var _onBackupTreeRestored = function(backup_id, error)
    {
        _setBackupUI.apply(this, [backup_id, 'idle', error ? error : 'Backup tree restored.']);
    };

    /**
     * Updates backup UI when doing tasks
     * @param backup_id
     * @param state
     * @param message
     */
    var _setBackupUI = function(backup_id, state, message)
    {
        appTray[state === 'processing' ? 'setProcessing' : 'setIdle']();
        controlPanelWindow.send('set-backup-ui', backup_id, state, message);
        message = moment().format('YYYY-MM-DD HH:mm:ss') + '\n' + message;
        controlPanelWindow.send('set-backup-history', backup_id, message);
    };

    m.exports = module;

})(module, require);