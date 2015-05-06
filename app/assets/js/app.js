var app = require('app');
var Tray = require('tray');
var BrowserWindow = require('browser-window');
var fs = require('fs');
var Menu = require('menu');

require('crash-reporter').start();

var mainWindow = null;
var mainPath = fs.realpathSync(__dirname + '/../../');
var mainTray = null;
var manifest = eval('(' + fs.readFileSync(mainPath + '/package.json', {encoding: 'utf8'}) + ')');

app.on('ready', function()
{
    mainTray = new Tray(mainPath + '/assets/css/images/tray.png');
    mainTray.setToolTip('Tray tooltip @todo');

    if (typeof app.dock !== 'undefined')
    {
        app.dock.hide();
    }

    mainTray.setContextMenu(Menu.buildFromTemplate(
        [
            {
                label: manifest.name + ' ' + manifest.version,
                enabled: false
            },
            {
                type: 'separator'
            },
            {
                label: 'Open settings panel',
                click: function()
                {
                    _toggleMainWindow();
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
                    app.quit();
                }
            }
        ]
    ));

    var _toggleMainWindow = function()
    {
        if (mainWindow === null)
        {
            mainWindow = new BrowserWindow({width: 800, height: 600, show: false});
            mainWindow.webContents.on('did-finish-load', function()
            {
                mainWindow.show();
                mainWindow.openDevTools({detach: true});
            });
            mainWindow.webContents.loadUrl('file://' + mainPath + '/assets/html/settings.html');
            mainWindow.on('closed', function()
            {
                mainWindow = null;
            });
        }
        else
        {
            mainWindow.focus();
        }
    };

    /*
    var ipc = require('ipc');
    ipc.on('asynchronous-message', function(event, arg)
    {
        console.log(arg);  // prints "ping"
        event.sender.send('asynchronous-reply', 'pong');
    });

    ipc.on('synchronous-message', function(event, arg)
    {
        console.log(arg);  // prints "ping"
        event.returnValue = 'pong';
    });
    */

    _toggleMainWindow();

});