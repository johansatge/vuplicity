(function(window, document)
{

    'use strict';

    var module = {};
    var backupTemplate = null;
    var backupsList = null;
    var ipc = require('ipc');
    var mouseOffset = null;

    module.init = function()
    {
        backupTemplate = document.querySelector('.js-backup-template');
        backupsList = document.querySelector('.js-backups-list');
        document.querySelector('.js-add-backup').addEventListener('click', function(evt)
        {
            evt.preventDefault();
            _createbackup({}, true);
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
            document.body.className += ' js-blur';
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
            _createbackup(backups[index], false);
        }
    };

    /**
     * Appends a new backup to the list
     * @param data
     * @param opened
     */
    var _createbackup = function(data, opened)
    {
        var new_backup = document.createElement('div');
        new_backup.innerHTML = backupTemplate.innerHTML;
        new_backup.className = backupTemplate.getAttribute('rel');
        backupsList.insertBefore(new_backup, backupsList.firstChild);
        for (var property in data)
        {
            var node = new_backup.querySelector('.js-' + property);
            node.setAttribute('value', data[property]);
        }
        new_backup.querySelector('.js-accordion').addEventListener('click', _onTogglebackup);
        new_backup.querySelector('.js-dir').addEventListener('change', _updatebackups);
        new_backup.querySelector('.js-dir-select').addEventListener('click', _onSelectDirectory);
        if (opened)
        {
            new_backup.className += ' js-opened';
        }
        new_backup.setAttribute('id', 'backup-' + new Date().getTime() + '-' + document.querySelectorAll('.js-backup').length);
        _updatebackups();
    };

    /**
     * Toggles a backup
     * @param evt
     */
    var _onTogglebackup = function(evt)
    {
        var backup = evt.currentTarget.parentNode.parentNode;
        if (backup.className.search('js-opened') !== -1)
        {
            backup.className = backup.className.replace('js-opened', '');
        }
        else
        {
            backup.className += ' js-opened';
        }
    };

    /**
     * Selects a directory by using the native file dialog
     * @param evt
     */
    var _onSelectDirectory = function(evt)
    {
        evt.preventDefault();
        ipc.send('select-directory', evt.currentTarget.parentNode.parentNode.parentNode.parentNode.parentNode.getAttribute('id'));
    };

    /**
     * Updates UI when a directory has been selected
     * @param data
     */
    var _onSelectedDirectory = function(data)
    {
        var input = document.querySelector('#' + data.backup_id + ' .js-dir');
        input.value = data.path;
        input.dispatchEvent(new Event('change'));
    };

    /**
     * Updates backup blocks
     */
    var _updatebackups = function()
    {
        var backups = document.querySelectorAll('.js-backup');
        for (var index = 0; index < backups.length; index += 1)
        {
            var backup = backups[index];
            var title = backup.querySelector('.js-dir').value;
            backup.querySelector('.js-title').innerHTML = title.length > 0 ? title : 'Unnamed backup';
        }
    };

    window.Settings = module;

})(window, document);