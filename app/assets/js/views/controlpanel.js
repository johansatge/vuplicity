(function(window, document, ipc, BackupElement)
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
        document.querySelector('.js-add-backup').addEventListener('click', _onCreateNewBackup);
        removeBackupNode.addEventListener('click', _onRequestBackupDeletion);
        ipc.on('set-backup', _onSetBackup);
        //ipc.on('directory-selected', _onSelectedDirectory);
        ipc.on('confirm-backup-deletion', _onConfirmBackupDeletion);
    };

    /**
     * Updates a backup (and creates it first, if needed)
     * @param data
     * @param is_visible
     */
    var _onSetBackup = function(data, is_visible)
    {
        if (typeof backups[data.id] === 'undefined')
        {
            var backup = new BackupElement();
            backup.init(_onToggleBackupVisibility, _onTriggerBackupAction);
            backupsListNode.insertBefore(backup.getItemNode(), backupsListNode.firstChild);
            backupsDetailNode.appendChild(backup.getDetailNode());
            backups[data.id] = backup;
        }
        if (is_visible)
        {
            backups[data.id].toggleVisibility();
        }
        backups[data.id].update(data);
    };

    /**
     * Asks the app to build a new backup item
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
        if (currentBackupID !== null)
        {
            evt.preventDefault();
            ipc.send('request-backup-deletion');
        }
    };

    /**
     * Deletes the selected backup when the user has confirmed the action
     */
    var _onConfirmBackupDeletion = function()
    {
        backupsListNode.removeChild(backups[currentBackupID].getItemNode());
        backupsDetailNode.removeChild(backups[currentBackupID].getDetailNode());
        backups[currentBackupID] = null;
        currentBackupID = null;
    };

    /**
     * Triggers an action from a backup item
     * @param action
     * @param id
     */
    var _onTriggerBackupAction = function(action, id)
    {
        backups[id].toggleProcessingStatus(true);
        if (action === 'refresh')
        {
            ipc.send('refresh-backup', id);
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

})(window, document, require('ipc'), BackupElement);