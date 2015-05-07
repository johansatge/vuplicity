(function(window, document)
{

    'use strict';

    var module = {};
    var backupListTemplate = null;
    var backupDetailTemplate = null;
    var backupsList = null;
    var backupsDetail = null;
    var backupToolbar = null;
    var ipc = require('ipc');
    var mouseOffset = null;

    module.init = function()
    {
        backupListTemplate = document.querySelector('.js-backup-list-template');
        backupDetailTemplate = document.querySelector('.js-backup-detail-template');
        backupsList = document.querySelector('.js-backups-list');
        backupsDetail = document.querySelector('.js-backups-detail');
        backupToolbar = document.querySelector('.js-backup-toolbar');
        backupToolbar.style.display = 'none';
        document.querySelector('.js-add-backup').addEventListener('click', function(evt)
        {
            evt.preventDefault();
            _createBackup({});
        });
        document.querySelector('.js-toolbar').addEventListener('mousedown', function(evt)
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
        });
        document.querySelector('.js-close').addEventListener('click', function(evt)
        {
            evt.preventDefault();
            ipc.send('window-close');
        });
        ipc.on('current-settings', _onInitbackups);
        ipc.send('settings-ready');
        ipc.on('directory-selected', _onSelectedDirectory);
        ipc.on('window-focus', function()
        {
            document.body.className = document.body.className.replace('js-blur', '');
        });
        ipc.on('window-blur', function()
        {
            // @todo enable this
            //document.body.className += ' js-blur';
        });
    };

    /**
     * Drags the window on mouse move
     * @param evt
     */
    var _dragWindow = function(evt)
    {
        var x = evt.screenX - mouseOffset.x;
        var y = evt.screenY - mouseOffset.y;
        ipc.send('window-move', {x: x, y: y});
    };

    /**
     * Inits available backups when received by the app
     * @param backups
     */
    var _onInitbackups = function(backups)
    {
        for (var index = 0; index < backups.length; index += 1)
        {
            _createBackup(backups[index]);
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
            if (typeof node !== 'undefined')
            {
                node.setAttribute('value', data[property]);
            }
        }
    };

    /**
     * Toggles a backup
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

    window.Settings = module;

})(window, document);