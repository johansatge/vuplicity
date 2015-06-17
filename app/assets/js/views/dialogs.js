/**
 * Control panel dialogs called by the main controller
 */
(function(require, m)
{

    'use strict';

    var dialog = require('dialog');

    var module = {};
    var context = null;

    module.setWindow = function(window)
    {
        context = window;
    };

    module.confirmStartBackup = function(callback)
    {
        var params = {
            type: 'info',
            message: 'What task do you want to start ?',
            buttons: ['Automatic backup', 'Full backup', 'Cancel']
        };
        dialog.showMessageBox(context, params, function(response)
        {
            if (response < 2)
            {
                callback(response === 0 ? '' : 'full');
            }
        });
    };

    module.confirmDeleteBackup = function(callback)
    {
        var params = {
            type: 'warning',
            message: 'Do you want to delete this backup ?',
            detail: 'The entry will be removed.\nNothing will be modified on the remote server.',
            buttons: ['Delete', 'Cancel']
        };
        dialog.showMessageBox(context, params, function(response)
        {
            if (response === 0)
            {
                callback();
            }
        });
    };

    module.selectBackupPath = function(callback)
    {
        dialog.showOpenDialog(context, {title: 'Select directory', properties: ['openDirectory']}, function(paths)
        {
            if (typeof paths !== 'undefined')
            {
                callback(paths[0]);
            }
        });
    };

    module.selectRestoreFileDestination = function(callback)
    {
        dialog.showSaveDialog(context, {title: 'Select the restore destination'}, function(destination_path)
        {
            if (typeof destination_path !== 'undefined')
            {
                callback(destination_path);
            }
        });
    };

    module.selectRestoreTreeDestination = function(callback)
    {
        var params = {
            title: 'Select the restore destination',
            properties: ['openDirectory', 'createDirectory']
        };
        dialog.showOpenDialog(context, params, function(destination_path)
        {
            if (typeof destination_path !== 'undefined')
            {
                callback(destination_path);
            }
        });
    };

    m.exports = module;

})(require, module);