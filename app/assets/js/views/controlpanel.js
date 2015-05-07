(function(window, document, ipc, BackupElement)
{

    'use strict';

    var module = {};
    var backupsListNode = null;
    var backupsDetailNode = null;
    var mouseOffset = null;
    var currentBackup = null;

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
    };

    /**
     * Inits window events
     */
    var _initEvents = function()
    {
        document.querySelector('.js-add-backup').addEventListener('click', _onCreateNewBackup);
        document.querySelector('.js-remove-backup').addEventListener('click', _onRequestBackupDeletion);
        document.querySelector('.js-toolbar').addEventListener('mousedown', _onDragWindow);
        document.querySelector('.js-close').addEventListener('click', _onCloseWindow);

        ipc.on('control-panel-init-data', _onInitBackups);
        //ipc.on('directory-selected', _onSelectedDirectory);
        ipc.on('window-focus', _onWindowFocus);
        ipc.on('window-blur', _onWindowBlur);
        ipc.on('confirm-backup-deletion', _onConfirmBackupDeletion);
    };

    /**
     * Closes the window
     * @param evt
     */
    var _onCloseWindow = function(evt)
    {
        evt.preventDefault();
        ipc.send('window-close');
    };

    /**
     * Window focus
     */
    var _onWindowFocus = function()
    {
        document.body.className = document.body.className.replace('js-blur', '');
    };

    /**
     * Window blur
     */
    var _onWindowBlur = function()
    {
        // @todo enable this
        document.body.className += ' js-blur';
    };

    /**
     * Starts dragging the window on toolbar mousedown
     * @param evt
     */
    var _onDragWindow = function(evt)
    {
        if (evt.target.className.indexOf('js-toolbar') === -1)
        {
            evt.stopPropagation();
            return;
        }
        mouseOffset = {x: evt.pageX, y: evt.pageY};
        document.addEventListener('mousemove', _dragWindow);
        document.addEventListener('mouseup', function()
        {
            document.removeEventListener('mousemove', _dragWindow);
        });
    };

    /**
     * Drags the window on mouse move
     * @param evt
     */
    var _dragWindow = function(evt)
    {
        ipc.send('window-move', {x: evt.screenX - mouseOffset.x, y: evt.screenY - mouseOffset.y});
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
        currentBackup = is_visible ? backup : null;
    };

    window.ControlPanel = module;

})(window, document, require('ipc'), BackupElement);