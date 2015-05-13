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
        removeBackupNode = document.querySelector('.js-remove-backup');
    };

    /**
     * Inits window events
     */
    var _initEvents = function()
    {
        document.querySelector('.js-add-backup').addEventListener('click', _onCreateNewBackup.bind(this));
        removeBackupNode.addEventListener('click', _onRequestBackupDeletion.bind(this));
        ipc.on('set-backup-options', _onSetBackupOptions.bind(this));
        ipc.on('directory-selected', _onSelectedBackupDirectory.bind(this));
        ipc.on('confirm-backup-deletion', _onConfirmBackupDeletion.bind(this));
        ipc.on('set-backup-status', _onSetBackupStatus.bind(this));
        ipc.on('set-backup-error', _onSetBackupError.bind(this));
        ipc.on('set-backup-ui', _onBackupUIUpdate.bind(this));
    };

    /**
     * Sets the state of the given backup
     * @param backup_id
     * @param status
     */
    var _onBackupUIUpdate = function(backup_id, status)
    {
        backups[backup_id].toggleProcessingStatus(status === 'idle' ? false : true);
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
            backup.init(_onToggleBackupVisibility, _onTriggerBackupAction.bind(this));
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
     * @param error
     * @private
     */
    var _onSetBackupStatus = function(id, data)
    {
        backups[id].updateStatus(data);
    };

    /**
     * Sets the error message of a backup (may be FALSE)
     * @param id
     * @param error
     */
    var _onSetBackupError = function(id, error)
    {
        backups[id].updateError(error);
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
     * Updates the needed backup item when a directory has been selected
     * @param path
     * @param id
     */
    var _onSelectedBackupDirectory = function(path, id)
    {
        backups[id].updateOptions({path: path});
    };

    /**
     * Requests the deletion of the current backup
     * @param evt
     */
    var _onRequestBackupDeletion = function(evt)
    {
        if (currentBackupID !== null)
        {
            evt.preventDefault();
            ipc.send('request-backup-deletion', currentBackupID);
        }
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
        if (action === 'refresh')
        {
            ipc.send('refresh-backup', id, data);
        }
        if (action === 'select-directory')
        {
            ipc.send('select-directory', id);
        }
        // @todo send request to the app for actions: "backup", "restore"
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
        is_visible ? removeBackupNode.removeAttribute('disabled') : removeBackupNode.setAttribute('disabled', 'disabled');
        currentBackupID = is_visible ? id : null;
    };

    window.ControlPanel = module;

})(window, document, require('ipc'), BackupItem);