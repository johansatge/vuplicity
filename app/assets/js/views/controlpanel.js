(function(window, document, ipc, BackupElement, Window)
{

    'use strict';

    var module = {};
    var backups = {};
    var backupsListNode = null;
    var backupsDetailNode = null;
    var currentBackupID = null;
    var removeBackupNode = null;

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
        ipc.on('control-panel-init-data', _onInitBackups);
        //ipc.on('directory-selected', _onSelectedDirectory);
        ipc.on('confirm-backup-deletion', _onConfirmBackupDeletion);
    };

    /**
     * Inits available backups when sent by the app
     * @param backups_list
     */
    var _onInitBackups = function(backups_list)
    {
        for (var index = 0; index < backups_list.length; index += 1)
        {
            _createBackup(backups_list[index], false);
        }
    };

    /**
     * Creates a new backup from the left panel
     * @param evt
     */
    var _onCreateNewBackup = function(evt)
    {
        evt.preventDefault();
        _createBackup.apply(this, [{}, true]);
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
     * Prepends a new backup to the list
     * @param data
     * @param is_visible
     */
    var _createBackup = function(data, is_visible)
    {
        var id = 'backup-' + new Date().getTime() + backupsListNode.childNodes.length;
        var backup = new BackupElement();
        backup.populate(id, data, _onToggleBackupVisibility, _onTriggerBackupAction);
        backupsListNode.insertBefore(backup.getItemNode(), backupsListNode.firstChild);
        backupsDetailNode.appendChild(backup.getDetailNode());
        if (is_visible)
        {
            backup.toggleVisibility();
        }
        backups[id] = backup;
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
        if (is_visible)
        {
            removeBackupNode.removeAttribute('disabled');
            currentBackupID = id;
        }
        else
        {
            removeBackupNode.setAttribute('disabled', 'disabled');
            currentBackupID = null;
        }
    };

    window.ControlPanel = module;

})(window, document, require('ipc'), BackupElement, Window);