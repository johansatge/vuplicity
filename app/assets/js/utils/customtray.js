/**
 * Registers the main tray
 */
(function(require, m)
{

    'use strict';

    var Tray = require('tray');
    var Menu = require('menu');

    var tray = null;
    var idleIcon = null;
    var processIcon = null;

    var module = function(label, idle_icon, process_icon, controlPanelCallback, quitCallback)
    {
        idleIcon = idle_icon;
        processIcon = process_icon;

        tray = new Tray(idleIcon.normal);
        tray.setToolTip(label);
        tray.setPressedImage(idleIcon.pressed);
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

        this.setIdle = function()
        {
            tray.setImage(idleIcon.normal);
            tray.setPressedImage(idleIcon.pressed);
        };

        this.setProcessing = function()
        {
            tray.setImage(processIcon.normal);
            tray.setPressedImage(processIcon.pressed);
        };
    };

    m.exports = module;

})(require, module);