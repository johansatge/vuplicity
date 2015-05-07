(function(window, document, ipc, BackupElement, Window)
{

    'use strict';

    var module = {};
    var backupsListNode = null;
    var backupsDetailNode = null;
    var currentBackup = null;
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
        if (currentBackup !== null)
        {
            evt.preventDefault();
            ipc.send('request-backup-deletion');
        }
    };

    /**
     * Deletes the selected backup
     * @param evt
     */
    var _onConfirmBackupDeletion = function(evt)
    {
        backupsListNode.removeChild(currentBackup.getItemNode());
        backupsDetailNode.removeChild(currentBackup.getDetailNode());
        currentBackup = null;
    };

    /**
     * Prepends a new backup to the list
     * @param data
     * @param is_visible
     */
    var _createBackup = function(data, is_visible)
    {
        var backup = new BackupElement();
        backup.populate(data);
        backup.onToggleVisibility(_onToggleBackupVisibility);
        backupsListNode.insertBefore(backup.getItemNode(), backupsListNode.firstChild);
        backupsDetailNode.appendChild(backup.getDetailNode());
        if (is_visible)
        {
            backup.toggleVisibility();
        }
    };

    /**
     * Stores the currently opened backup when toggling it
     * @param backup
     * @param is_visible
     */
    var _onToggleBackupVisibility = function(backup, is_visible)
    {
        if (currentBackup !== null && is_visible)
        {
            currentBackup.toggleVisibility();
        }
        if (is_visible)
        {
            removeBackupNode.removeAttribute('disabled');
            currentBackup = backup;
        }
        else
        {
            removeBackupNode.setAttribute('disabled', 'disabled');
            currentBackup = null;
        }
    };

    window.ControlPanel = module;

})(window, document, require('ipc'), BackupElement, Window);