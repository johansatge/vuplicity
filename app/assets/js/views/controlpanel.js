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

    /**
     * Inits the view
     */
    module.init = function()
    {
        _initDOM.apply(this);
        _initEvents.apply(this);
        ipc.send('control-panel-ready');
    };

    /**
     * Inits DOM stuff
     */
    var _initDOM = function()
    {
        backupsListNode = document.querySelector('.js-backups-list');
        backupsDetailNode = document.querySelector('.js-backups-detail');
        addBackupNode = document.querySelector('.js-add-backup');
        removeBackupNode = document.querySelector('.js-remove-backup');
    };

    /**
     * Inits window events
     */
    var _initEvents = function()
    {
        addBackupNode.addEventListener('click', _onCreateNewBackup.bind(this));
        removeBackupNode.addEventListener('click', _onRequestBackupDeletion.bind(this));
        ipc.on('set-backup-options', _onSetBackupOptions.bind(this));
        ipc.on('set-backup-path', _onSetBackupPath.bind(this));
        ipc.on('set-backup-status', _onSetBackupStatus.bind(this));
        ipc.on('set-backup-ui', _onSetBackupUI.bind(this));
        ipc.on('set-backup-file-tree', _onSetBackupFileTree.bind(this));
        ipc.on('set-backup-history', _onSetBackupHistory.bind(this));
        ipc.on('confirm-backup-deletion', _onConfirmBackupDeletion.bind(this));
    };

    /**
     * Updates the history of a backup
     * @param id
     * @param history
     */
    var _onSetBackupHistory = function(id, history)
    {
        backups[id].updateHistory(history);
    };

    /**
     * Updates the file tree of a backup
     * @param id
     * @param tree
     */
    var _onSetBackupFileTree = function(id, tree)
    {
        backups[id].updateFileTree(tree);
    };

    /**
     * Sets the UI state of the given backup
     * @param backup_id
     * @param status
     * @param message
     * @param has_error
     */
    var _onSetBackupUI = function(backup_id, status, message, has_error)
    {
        backups[backup_id].toggleProcessingStatus(status !== 'idle', message, has_error);
        _updateDeleteButton.apply(this);
    };

    /**
     * Updates the options of a backup (and creates it first, if needed)
     * @param id
     * @param data
     * @param is_visible
     */
    var _onSetBackupOptions = function(id, data, is_visible)
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
        backups[id].updateOptions(data);
    };

    /**
     * Updates the status of a backup
     * @param id
     * @param data
     */
    var _onSetBackupStatus = function(id, data)
    {
        backups[id].updateStatus(data);
    };

    /**
     * Builds a new backup item
     * @param evt
     */
    var _onCreateNewBackup = function(evt)
    {
        evt.preventDefault();
        _onSetBackupOptions.apply(this, ['b-' + new Date().getTime(), {}, true]);
    };

    /**
     * Updates the needed backup item when a directory has been selected in the "open" dialog
     * @param path
     * @param id
     */
    var _onSetBackupPath = function(path, id)
    {
        backups[id].updateOptions({path: path});
    };

    /**
     * Requests the deletion of the current backup
     * @param evt
     */
    var _onRequestBackupDeletion = function(evt)
    {
        evt.preventDefault();
        ipc.send('request-backup-deletion', currentBackupID);
    };

    /**
     * Deletes the selected backup when the user has confirmed the action
     * @param backup_id
     */
    var _onConfirmBackupDeletion = function(backup_id)
    {
        backupsListNode.removeChild(backups[backup_id].getItemNode());
        backupsDetailNode.removeChild(backups[backup_id].getDetailNode());
        backups[backup_id] = null;
        if (backup_id === currentBackupID)
        {
            currentBackupID = null;
            _updateDeleteButton.apply(this);
        }
    };

    /**
     * Triggers an action from a backup item
     * @param action
     * @param id
     * @param data
     */
    var _onTriggerBackupAction = function(action, id, data)
    {
        if (action === 'clear-history')
        {
            backups[id].clearHistory();
        }
        else
        {
            ipc.send(action, id, data);
        }
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