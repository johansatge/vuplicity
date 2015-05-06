(function(window, document)
{

    'use strict';

    var module = {};
    var taskTemplate = null;
    var tasksList = null;
    var ipc = require('ipc');

    module.init = function()
    {
        taskTemplate = document.querySelector('.js-task-template');
        tasksList = document.querySelector('.js-tasks-list');
        document.querySelector('.js-add-task').addEventListener('click', function(evt)
        {
            evt.preventDefault();
            _createTask({}, true);
        });
        ipc.on('current-settings', _onInitTasks);
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
     * Inits available tasks when received by the app
     * @param tasks
     */
    var _onInitTasks = function(tasks)
    {
        for (var index = 0; index < tasks.length; index += 1)
        {
            _createTask(tasks[index], false);
        }
    };

    /**
     * Appends a new task to the list
     * @param data
     * @param opened
     */
    var _createTask = function(data, opened)
    {
        var new_task = document.createElement('div');
        new_task.innerHTML = taskTemplate.innerHTML;
        new_task.className = taskTemplate.getAttribute('rel');
        tasksList.insertBefore(new_task, tasksList.firstChild);
        for (var property in data)
        {
            var node = new_task.querySelector('.js-' + property);
            node.setAttribute('value', data[property]);
        }
        new_task.querySelector('.js-accordion').addEventListener('click', _onToggleTask);
        new_task.querySelector('.js-dir').addEventListener('change', _updateTasks);
        new_task.querySelector('.js-dir-select').addEventListener('click', _onSelectDirectory);
        if (opened)
        {
            new_task.className += ' js-opened';
        }
        new_task.setAttribute('id', 'task-' + new Date().getTime() + '-' + document.querySelectorAll('.js-task').length);
        _updateTasks();
    };

    /**
     * Toggles a task
     * @param evt
     */
    var _onToggleTask = function(evt)
    {
        var task = evt.currentTarget.parentNode.parentNode;
        if (task.className.search('js-opened') !== -1)
        {
            task.className = task.className.replace('js-opened', '');
        }
        else
        {
            task.className += ' js-opened';
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
        var input = document.querySelector('#' + data.task_id + ' .js-dir');
        input.value = data.path;
        input.dispatchEvent(new Event('change'));
    };

    /**
     * Updates task blocks
     */
    var _updateTasks = function()
    {
        var tasks = document.querySelectorAll('.js-task');
        for (var index = 0; index < tasks.length; index += 1)
        {
            var task = tasks[index];
            var title = task.querySelector('.js-dir').value;
            task.querySelector('.js-title').innerHTML = title.length > 0 ? title : 'Unnamed task';
        }
    };

    window.Settings = module;

})(window, document);