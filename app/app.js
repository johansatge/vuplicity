/**
 * App bootstrap
 */
(function(process, require, __dirname)
{

    'use strict';

    var app = require('app');
    var MainController = require(__dirname + '/assets/js/controllers/main.js');
    var CustomTray = require(__dirname + '/assets/js//utils/customtray.js');
    var CLI = require(__dirname + '/assets/js/utils/cli.js');

    var tray = null;

    /**
     * Inits the main controller when the electron app is ready
     */
    var _onAppReady = function()
    {
        if (typeof app.dock !== 'undefined')
        {
            app.dock.hide();
        }
        _initTray.apply(this);
        _initController.apply(this);
    };

    /**
     * Inits main tray
     */
    var _initTray = function()
    {
        var label = app.getName() + ' ' + app.getVersion();
        tray = new CustomTray(label, __dirname + '/assets/css/images', _onShowControlPanel.bind(this), _onQuitFromTray.bind(this));
    };

    /**
     * Inits main controller
     */
    var _initController = function()
    {
        var panel_path = 'file://' + __dirname + '/assets/html/controlpanel.html';
        var config_path = CLI.getCustomConfigPath();
        if (config_path === false)
        {
            var home_path = process.env[process.platform !== 'win32' ? 'HOME' : 'USERPROFILE'].replace(/\/$/, '');
            config_path = home_path + '/.vuplicity';
        }
        MainController.init(panel_path, config_path.replace(/\/$/, '') + '/backup-%s.json', tray);
        MainController.showControlPanel();
    };

    /**
     * Displays the control panel
     */
    var _onShowControlPanel = function()
    {
        MainController.showControlPanel();
    };

    /**
     * Do not quit when all windows are closed
     * @param evt
     */
    var _onBeforeQuit = function(evt)
    {
        evt.preventDefault();
    };

    /**
     * Quits the app from the tray
     */
    var _onQuitFromTray = function()
    {
        app.removeListener('before-quit', _onBeforeQuit);
        app.quit();
    };

    require('crash-reporter').start();
    app.on('ready', _onAppReady.bind(this));
    app.on('before-quit', _onBeforeQuit.bind(this));

})(process, require, __dirname);