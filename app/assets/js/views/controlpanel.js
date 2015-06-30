/**
 * Manages the control panel by making the backup items communicate with the app
 */
(function(window, document, ipc, BackupItem)
{

    'use strict';

    var module = {};
    var backups = {};
    var backupsListNode = null;
    var backupsDetailNode = null;
    var addBackupNode = null;
    var removeBackupNode = null;
    var currentBackupID = null;

    module.init = function()
    {
        _initDOM.apply(this);
        _initEvents.apply(this);
        _initIPC.apply(this);
        ipc.send('control-panel-ready');
    };

    var _initDOM = function()
    {
        backupsListNode = document.querySelector('.js-backups-list');
        backupsDetailNode = document.querySelector('.js-backups-detail');
        addBackupNode = document.querySelector('.js-add-backup');
        removeBackupNode = document.querySelector('.js-remove-backup');
    };

    var _initEvents = function()
    {
        addBackupNode.addEventListener('click', _onCreateNewBackup.bind(this));
        removeBackupNode.addEventListener('click', _onRequestBackupDeletion.bind(this));
    };

    var _initIPC = function()
    {
        ipc.on('set-backup-next-date', function(id, date)
        {
            backups[id].updateNextDate(date);
        });
        ipc.on('set-backup-last-date', function(id, date)
        {
            backups[id].updateLastDate(date);
        });
        ipc.on('set-backup-path', function(path, id)
        {
            backups[id].updateOptions({path: path});
        });
        ipc.on('set-backup-status', function(id, data)
        {
            backups[id].updateStatus(data);
        });
        ipc.on('set-backup-file-tree', function(id, tree)
        {
            backups[id].updateFileTree(tree);
        });
        ipc.on('set-backup-history', function(id, history)
        {
            backups[id].updateHistory(history);
        });
        ipc.on('set-backup-progress', function(id, progress)
        {
            backups[id].setProgress(progress);
        });
        ipc.on('set-backup-ui', function(id, status)
        {
            backups[id].toggleProcessingStatus(status !== 'idle');
            _updateDeleteButton.apply(this);
        });
        ipc.on('confirm-backup-deletion', function(id)
        {
            backupsListNode.removeChild(backups[id].getItemNode());
            backupsDetailNode.removeChild(backups[id].getDetailNode());
            backups[id] = null;
            if (id === currentBackupID)
            {
                currentBackupID = null;
                _updateDeleteButton.apply(this);
            }
        });
        ipc.on('set-backup-data', function(id, options, schedules, is_visible)
        {
            if (typeof backups[id] === 'undefined')
            {
                var backup = new BackupItem(id);
                backup.init(_onToggleBackupVisibility.bind(this), _onTriggerBackupAction.bind(this));
                backupsListNode.insertBefore(backup.getItemNode(), backupsListNode.firstChild);
                backupsDetailNode.appendChild(backup.getDetailNode());
                backups[id] = backup;
            }
            if (is_visible)
            {
                backups[id].toggleVisibility();
            }
            backups[id].updateOptions(options);
            backups[id].updateSchedules(schedules);
        });
    };

    /**
     * Builds a new backup item
     * @param evt
     */
    var _onCreateNewBackup = function(evt)
    {
        evt.preventDefault();
        ipc.send('create-backup');
    };

    /**
     * Requests the deletion of the current backup
     * @param evt
     */
    var _onRequestBackupDeletion = function(evt)
    {
        evt.preventDefault();
        ipc.send('delete-backup', currentBackupID);
    };

    /**
     * Triggers an action from a backup item
     * @param action
     * @param id
     * @param data
     */
    var _onTriggerBackupAction = function(action, id, data)
    {
        ipc.send.apply(ipc, arguments);
    };

    /**
     * Stores the currently opened backup when toggling it
     * @param id
     * @param is_visible
     */
    var _onToggleBackupVisibility = function(id, is_visible)
    {
        if (currentBackupID !== null && is_visible)
        {
            backups[currentBackupID].toggleVisibility();
        }
        currentBackupID = is_visible ? id : null;
        _updateDeleteButton.apply(this);
    };

    /**
     * Updates the "-" button of the left panel
     */
    var _updateDeleteButton = function()
    {
        var enabled = currentBackupID !== null && !backups[currentBackupID].isProcessing();
        enabled ? removeBackupNode.removeAttribute('disabled') : removeBackupNode.setAttribute('disabled', 'disabled');
    };

    window.ControlPanel = module;

})(window, document, require('ipc'), BackupItem);