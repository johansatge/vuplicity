(function(window, document, ipc)
{

    'use strict';

    var module = {};
    var backupListTemplate = null;
    var backupDetailTemplate = null;
    var backupsList = null;
    var backupsDetail = null;
    var backupToolbar = null;
    var mouseOffset = null;

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
        backupListTemplate = document.querySelector('.js-backup-list-template');
        backupDetailTemplate = document.querySelector('.js-backup-detail-template');
        backupsList = document.querySelector('.js-backups-list');
        backupsDetail = document.querySelector('.js-backups-detail');
        backupToolbar = document.querySelector('.js-backup-toolbar');
        backupToolbar.style.display = 'none';
    };

    /**
     * Inits window events
     */
    var _initEvents = function()
    {
        document.querySelector('.js-add-backup').addEventListener('click', _onCreateNewBackup.bind(this));
        document.querySelector('.js-toolbar').addEventListener('mousedown', _onDragWindow.bind(this));
        document.querySelector('.js-close').addEventListener('click', _onCloseWindow.bind(this));

        ipc.on('current-settings', _onInitBackups);
        ipc.on('directory-selected', _onSelectedDirectory);
        ipc.on('window-focus', _onWindowFocus.bind(this));
        ipc.on('window-blur', _onWindowBlur.bind(this));
    };

    /**
     * Creates a new backup from the left panel
     * @param evt
     */
    var _onCreateNewBackup = function(evt)
    {
        evt.preventDefault();
        _createBackup.apply(this, {});
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
        //document.body.className += ' js-blur';
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
            _createBackup(backups_list[index]);
        }
    };

    /**
     * Appends a new backup to the list
     * @param data
     */
    var _createBackup = function(data)
    {
        var new_backup_item = document.createElement('div');
        new_backup_item.innerHTML = backupListTemplate.innerHTML;
        new_backup_item.className = backupListTemplate.getAttribute('rel');
        backupsList.insertBefore(new_backup_item, backupsList.firstChild);
        new_backup_item.addEventListener('click', _onToggleBackup);
        var new_id = 'backup-' + new Date().getTime() + '-' + document.querySelectorAll('.js-backup-item').length;
        new_backup_item.setAttribute('id', new_id);

        var new_backup_detail = document.createElement('form');
        new_backup_detail.innerHTML = backupDetailTemplate.innerHTML;
        new_backup_detail.className = backupDetailTemplate.getAttribute('rel');
        new_backup_detail.setAttribute('rel', new_id);
        new_backup_detail.style.display = 'none';
        new_backup_detail.querySelector('.js-path-select').addEventListener('click', _onSelectDirectory);
        backupsDetail.appendChild(new_backup_detail);
        for (var property in data)
        {
            var node = new_backup_detail.querySelector('.js-field-' + property);
            if (node !== null)
            {
                node.setAttribute('value', data[property]);
            }
        }
    };

    /**
     * Toggles a backup view when clicking on an item of the left panel
     * @param evt
     */
    var _onToggleBackup = function(evt)
    {
        var item = evt.currentTarget;
        var config = backupsDetail.querySelector('[rel="' + item.getAttribute('id') + '"]');
        if (item.className.search('js-active') !== -1)
        {
            config.style.display = 'none';
            item.className = item.className.replace('js-active', '');
            backupToolbar.style.display = 'none';
        }
        else
        {
            var current_item = backupsList.querySelector('.js-active');
            if (current_item !== null)
            {
                current_item.dispatchEvent(new Event('click'));
            }
            item.className += ' js-active';
            config.style.display = 'block';
            backupToolbar.style.display = 'block';
        }
    };

    /**
     * Selects a directory by using the native file dialog
     * @param evt
     */
    var _onSelectDirectory = function(evt)
    {
        evt.preventDefault();
        // @todo refactor this
        //ipc.send('select-directory', evt.currentTarget.parentNode.parentNode.parentNode.parentNode.parentNode.getAttribute('id'));
    };

    /**
     * Updates UI when a directory has been selected
     * @param data
     */
    var _onSelectedDirectory = function(data)
    {
        var input = document.querySelector('#' + data.backup_id + ' .js-field-path');
        input.value = data.path;
        input.dispatchEvent(new Event('change'));
    };

    /**
     * Updates backup blocks
     * @todo update backup name in the list when editing the config (only on save ?)
     *
     var _updateBackups = function()
     {
         var backups = document.querySelectorAll('.js-backup-item');
         for (var index = 0; index < backups.length; index += 1)
         {
             var backup = backups[index];
             var title = backup.querySelector('.js-dir').value;
             backup.querySelector('.js-title').innerHTML = title.length > 0 ? title : 'Unnamed backup';
         }
     };*/

    window.ControlPanel = module;

})(window, document, require('ipc'));