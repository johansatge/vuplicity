(function(require, module)
{

    'use strict';

    var Tray = require('tray');
    var EventEmitter = require('events').EventEmitter;
    var BrowserWindow = require('browser-window');
    var Menu = require('menu');
    var ipc = require('ipc');
    var dialog = require('dialog');
    var util = require('util');

    var Main = function(app_name, app_version, app_path)
    {

        var appPath = app_path;
        var appName = app_name;
        var appVersion = app_version;

        var controlPanelWindow = null;
        var mainTray = null;

        /**
         * Inits the controller
         */
        this.init = function()
        {
            _initTray.apply(this);
            _initIPC.apply(this);
            _toggleControlPanelWindow.apply(this);
        };

        /**
         * Inits the tray
         */
        var _initTray = function()
        {
            mainTray = new Tray(appPath + '/assets/css/images/tray.png');
            mainTray.setToolTip(appName + ' ' + appVersion);

            var self = this;
            mainTray.setContextMenu(Menu.buildFromTemplate(
                [
                    {
                        label: appName + ' ' + appVersion,
                        enabled: false
                    },
                    {
                        type: 'separator'
                    },
                    {
                        label: 'Open control panel',
                        click: function()
                        {
                            _toggleControlPanelWindow.apply(self);
                        }
                    },
                    {
                        type: 'separator'
                    },
                    {
                        label: 'About...',
                        selector: 'orderFrontStandardAboutPanel:'
                    },
                    {
                        label: 'Quit',
                        accelerator: 'Command+Q',
                        click: function()
                        {
                            _onQuitFromTray.apply(self);
                        }
                    }
                ]
            ));
        };

        /**
         * Inits IPC events
         */
        var _initIPC = function()
        {
            ipc.on('control-panel-ready', function(event)
            {
                var sample_settings = [ // @todo get real ones (localStorage ? User file ?)
                    {
                        title: 'My first backup',
                        url: 'http://test-url-1',
                        path: '/Users/coucou1',
                        options: '--size 5'
                    },
                    {
                        title: 'My second backup',
                        url: 'http://test-url-2',
                        path: '/Users/coucou2',
                        options: '--size 5'
                    },
                    {
                        title: 'My third backup',
                        url: 'http://test-url-3',
                        path: '/Users/coucou3',
                        options: '--size 5'
                    },
                    {
                        title: 'My fourth backup',
                        url: 'http://test-url-4',
                        path: '/Users/coucou4',
                        options: '--size 5'
                    }
                ];
                event.sender.send('control-panel-init-data', sample_settings);
            });

            ipc.on('request-backup-deletion', function(event)
            {
                var params = {
                    type: 'warning',
                    message: 'Do you want to delete this backup ?',
                    detail: 'The entry will be removed.\nNothing will be modified on the remote server.',
                    buttons: ['Delete', 'Cancel']
                };
                dialog.showMessageBox(controlPanelWindow, params, function(response)
                {
                    if (response === 0)
                    {
                        event.sender.send('confirm-backup-deletion');
                    }
                });
            });

            ipc.on('select-directory', function(event, backup_id)
            {
                dialog.showOpenDialog(controlPanelWindow, {title: '@todo title', properties: ['openDirectory']}, function(paths)
                {
                    if (typeof paths !== 'undefined')
                    {
                        event.sender.send('directory-selected', {backup_id: backup_id, path: paths[0]});
                    }
                });
            });

            ipc.on('window-move', function(event, position)
            {
                controlPanelWindow.setPosition(position.x, position.y);
            });

            ipc.on('window-close', function()
            {
                controlPanelWindow.close();
            });
        };

        /**
         * Quits the app from the tray item
         */
        var _onQuitFromTray = function()
        {
            this.emit('quit');
        };

        /**
         * Creates the settings window
         */
        var _toggleControlPanelWindow = function()
        {
            if (controlPanelWindow === null)
            {
                _initControlPanelWindow.apply(this);
            }
            else
            {
                controlPanelWindow.focus();
            }
        };

        /**
         * Creates a new "Settings" window
         */
        var _initControlPanelWindow = function()
        {
            controlPanelWindow = new BrowserWindow({
                width: 900,
                height: 650,
                'min-width': 900,
                'min-height': 650,
                show: false,
                frame: false,
                transparent: true
            });
            controlPanelWindow.webContents.on('did-finish-load', function()
            {
                controlPanelWindow.show();
                controlPanelWindow.openDevTools({detach: true});
            });
            controlPanelWindow.webContents.loadUrl('file://' + appPath + '/assets/html/controlpanel.html');
            controlPanelWindow.on('closed', function()
            {
                controlPanelWindow = null;
            });
            controlPanelWindow.on('focus', function()
            {
                controlPanelWindow.webContents.send('window-focus');
            });
            controlPanelWindow.on('blur', function()
            {
                controlPanelWindow.webContents.send('window-blur');
            });
        };

    };

    util.inherits(Main, EventEmitter);

    module.exports = Main;

})(require, module);