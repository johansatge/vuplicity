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

        var settingsWindow = null;
        var mainTray = null;

        /**
         * Inits the controller
         */
        this.init = function()
        {
            _initTray.apply(this);
            _initIPC.apply(this);
            _toggleSettingsWindow.apply(this);
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
                            _toggleSettingsWindow.apply(self);
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

            ipc.on('select-directory', function(event, backup_id)
            {
                dialog.showOpenDialog(settingsWindow, {title: '@todo title', properties: ['openDirectory']}, function(paths)
                {
                    if (typeof paths !== 'undefined')
                    {
                        event.sender.send('directory-selected', {backup_id: backup_id, path: paths[0]});
                    }
                });
            });

            ipc.on('window-move', function(event, position)
            {
                settingsWindow.setPosition(position.x, position.y);
            });

            ipc.on('window-close', function()
            {
                settingsWindow.close();
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
        var _toggleSettingsWindow = function()
        {
            if (settingsWindow === null)
            {
                _initSettingsWindow.apply(this);
            }
            else
            {
                settingsWindow.focus();
            }
        };

        /**
         * Creates a new "Settings" window
         */
        var _initSettingsWindow = function()
        {
            settingsWindow = new BrowserWindow({
                width: 900,
                height: 650,
                'min-width': 900,
                'min-height': 650,
                show: false,
                frame: false,
                transparent: true
            });
            settingsWindow.webContents.on('did-finish-load', function()
            {
                settingsWindow.show();
                settingsWindow.openDevTools({detach: true});
            });
            settingsWindow.webContents.loadUrl('file://' + appPath + '/assets/html/controlpanel.html');
            settingsWindow.on('closed', function()
            {
                settingsWindow = null;
            });
            settingsWindow.on('focus', function()
            {
                settingsWindow.webContents.send('window-focus');
            });
            settingsWindow.on('blur', function()
            {
                settingsWindow.webContents.send('window-blur');
            });
        };

    };

    util.inherits(Main, EventEmitter);

    module.exports = Main;

})(require, module);