(function(window, document)
{

    'use strict';

    var module = {};

    module.init = function()
    {
        console.log('settings init @todo');





        /*var ipc = require('ipc');

        ipc.on('asynchronous-reply', function(arg)
        {
            console.log(arg); // prints "pong"
        });
        ipc.send('asynchronous-message', 'ping');*/
    };

    window.Settings = module;

})(window, document);