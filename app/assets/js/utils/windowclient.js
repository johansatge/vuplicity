/**
 * Registers the needed events in the BrowserWindow client context
 * Used mostly to make the transparent window to behave like a native one (drag, focus, blur...)
 */
(function(window, document, ipc)
{

    'use strict';

    var module = {};
    var mouseOffset = null;

    /**
     * Inits the window behavior
     */
    module.init = function()
    {
        document.querySelector('.js-window-handler').addEventListener('mousedown', _onDragWindow);
        document.querySelector('.js-window-close').addEventListener('click', _onCloseWindow);
        ipc.on('window-focus', _onWindowFocus);
        ipc.on('window-blur', _onWindowBlur);
    };

    /**
     * Starts dragging the window on mousedown
     * @param evt
     */
    var _onDragWindow = function(evt)
    {
        if (evt.target.className.indexOf('js-window-handler') === -1)
        {
            evt.stopPropagation();
            return;
        }
        mouseOffset = {x: evt.pageX, y: evt.pageY};
        document.addEventListener('mousemove', _dragWindow);
        document.addEventListener('mouseup', function()
        {
            document.removeEventListener('mousemove', _dragWindow);
        });
    };

    /**
     * Drags the window on mouse move
     * @param evt
     */
    var _dragWindow = function(evt)
    {
        ipc.send('window-move', evt.screenX - mouseOffset.x, evt.screenY - mouseOffset.y);
    };

    /**
     * Window focus
     */
    var _onWindowFocus = function()
    {
        document.body.className = document.body.className.replace('js-blur', '');
    };

    /**
     * Window blur
     */
    var _onWindowBlur = function()
    {
        document.body.className += ' js-blur';
    };

    /**
     * Window close
     * @param evt
     */
    var _onCloseWindow = function(evt)
    {
        evt.preventDefault();
        ipc.send('window-close');
    };

    window.WindowClient = module;

})(window, document, require('ipc'));