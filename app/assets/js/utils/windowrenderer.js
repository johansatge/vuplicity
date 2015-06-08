/**
 * Registers a new BrowserWindow and manages the related features (communication with WindowClient, etc)
 */
(function(require, m)
{

    'use strict';

    var BrowserWindow = require('browser-window');
    var ipc = require('ipc');
    var CLI = require(__dirname + '/cli.js');

    var module = function()
    {

        var window = null;

        /**
         * Loads the requested window in a new URL
         * @param url
         */
        this.load = function(url)
        {
            window = new BrowserWindow({
                width: 900,
                height: 720,
                'min-width': 800,
                'min-height': 500,
                show: false,
                frame: false,
                transparent: true
            });
            window.webContents.loadUrl(url);
            window.on('focus', _onWindowFocus.bind(this));
            window.on('blur', _onWindowBlur.bind(this));
            ipc.on('window-move', _onWindowMove.bind(this));
            ipc.on('window-close', _onWindowClose.bind(this));
        };

        /**
         * Brings the window to the first plan
         */
        this.makeVisible = function()
        {
            if (!window.isVisible())
            {
                window.show();
                if (CLI.devToolsEnabled())
                {
                    window.openDevTools({detach: true});
                }
            }
            else
            {
                window.focus();
            }
        };

        /**
         * Returns the BrowserWindow object
         */
        this.getWindow = function()
        {
            return window;
        };

        /**
         * Sends an IPC message
         */
        this.send = function()
        {
            window.webContents.send.apply(window.webContents, arguments);
        };

        /**
         * Window focus event
         */
        var _onWindowFocus = function()
        {
            window.webContents.send('window-focus');
        };

        /**
         * Window blur event
         */
        var _onWindowBlur = function()
        {
            window.webContents.send('window-blur');
        };

        /**
         * Moves the control panel
         */
        var _onWindowMove = function(evt, x, y)
        {
            window.setPosition(x, y);
        };

        /**
         * Closes the control panel
         */
        var _onWindowClose = function()
        {
            window.hide();
        };

    };

    m.exports = module;

})(require, module);