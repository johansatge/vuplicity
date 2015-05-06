(function(require, js_path)
{

    'use strict';

    var fs = require('fs');
    var app = require('app');
    var crash_reporter = require('crash-reporter');

    /**
     * Inits the main controller when the electron app is ready
     */
    var _onAppReady = function()
    {
        if (typeof app.dock !== 'undefined')
        {
            app.dock.hide();
        }
        var app_path = js_path.replace(/\/assets\/js$/, '');
        var Main = require(app_path + '/assets/js/controllers/main.js');
        var controller = new Main(app.getName(), app.getVersion(), app_path);
        controller.on('quit', _onQuitFromController);
        controller.init();
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
     * Quits the app
     */
    var _onQuitFromController = function()
    {
        app.removeListener('before-quit', _onBeforeQuit);
        app.quit();
    };

    crash_reporter.start();
    app.on('ready', _onAppReady);
    app.on('before-quit', _onBeforeQuit);

})(require, __dirname);