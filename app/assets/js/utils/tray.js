/**
 * Registers the main tray
 */
(function(require, m)
{

    'use strict';

    var Tray = require('tray');
    var Menu = require('menu');

    var module = function(label, icon_path, controlPanelCallback, quitCallback)
    {

        var tray = new Tray(icon_path);
        tray.setToolTip(label);

        tray.setContextMenu(Menu.buildFromTemplate(
            [
                {
                    label: label,
                    enabled: false
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Open control panel',
                    click: function()
                    {
                        controlPanelCallback();
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
                        quitCallback();
                    }
                }
            ]
        ));

    };

    m.exports = module;

})(require, module);