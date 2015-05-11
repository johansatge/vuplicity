/**
 * Registers a new BrowserWindow and manages the related features (communication with WindowClient, etc)
 */
(function(require, m)
{

    'use strict';

    var BrowserWindow = require('browser-window');
    var ipc = require('ipc');

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
                height: 730,
                'min-width': 900,
                'min-height': 730,
                show: false,
                frame: false,
                transparent: true
            });
            window.webContents.on('did-finish-load', function()
            {
                window.show();
                window.openDevTools({detach: true});
            });
            window.webContents.loadUrl(url);
            window.on('closed', function()
            {
                window = null;
            });
            window.on('focus', function()
            {
                window.webContents.send('window-focus');
            });
            window.on('blur', function()
            {
                window.webContents.send('window-blur');
            });
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
         * Sets the position of the window
         * @param x
         * @param y
         */
        this.setPosition = function(x, y)
        {
            window.setPosition(x, y);
        };

        /**
         * Focus status
         */
        this.focus = function()
        {
            window.focus();
        };

        /**
         * Closes BrowserWindow object
         */
        this.close = function()
        {
            window.close();
            window = null;
        };
    };

    m.exports = module;

})(require, module);