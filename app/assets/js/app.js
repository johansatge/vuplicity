var app = require('app');
var Tray = require('tray');
var BrowserWindow = require('browser-window');
var fs = require('fs');
var Menu = require('menu');
var ipc = require('ipc');
var dialog = require('dialog');

require('crash-reporter').start();

var mainWindow = null;
var mainPath = fs.realpathSync(__dirname + '/../../');
var mainTray = null;
var quitFromTray = false;
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
                    _toggleSettingsWindow();
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
                    quitFromTray = true;
                    app.quit();
                }
            }
        ]
    ));

    ipc.on('settings-ready', function(event)
    {
        var sample_settings = [ // @todo get real ones (localStorage ? User file ?)
            {
                url: 'http://test-url-1',
                dir: '/Users/coucou1',
                options: '--size 5'
            },
            {
                url: 'http://test-url-2',
                dir: '/Users/coucou2',
                options: '--size 5'
            },
            {
                url: 'http://test-url-3',
                dir: '/Users/coucou3',
                options: '--size 5'
            },
            {
                url: 'http://test-url-4',
                dir: '/Users/coucou4',
                options: '--size 5'
            }
        ];
        event.sender.send('current-settings', sample_settings);
    });

    ipc.on('select-directory', function(event, backup_id)
    {
        dialog.showOpenDialog(mainWindow, {title: '@todo title', properties: ['openDirectory']}, function(paths)
        {
            if (typeof paths !== 'undefined')
            {
                event.sender.send('directory-selected', {backup_id: backup_id, path: paths[0]});
            }
        });
    });

    ipc.on('window-move', function(event, position)
    {
        mainWindow.setPosition(position.x, position.y);
    });

    ipc.on('window-close', function()
    {
        mainWindow.close();
    });

    app.on('before-quit', function(evt)
    {
        if (!quitFromTray)
        {
            evt.preventDefault();
        }
    });

    /**
     * Creates the settings window
     */
    var _toggleSettingsWindow = function()
    {
        if (mainWindow === null)
        {
            mainWindow = new BrowserWindow({
                width: 800,
                height: 600,
                'min-width': 750,
                'min-height': 400,
                show: false,
                frame: false,
                transparent: true
            });
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
            mainWindow.on('focus', function()
            {
                mainWindow.webContents.send('window-focus');
            });
            mainWindow.on('blur', function()
            {
                mainWindow.webContents.send('window-blur');
            });
        }
        else
        {
            mainWindow.focus();
        }
    };

    _toggleSettingsWindow();
});