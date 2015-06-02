/**
 * DOM utils
 */
(function(window, document)
{

    'use strict';

    var module = {};

    /**
     * Adds or removes the given class on/from a node element
     * @param node
     * @param classname
     * @param on
     */
    module.toggleClass = function(node, classname, on)
    {
        if (on)
        {
            node.className += ' ' + classname;
        }
        else
        {
            node.className = node.className.replace(classname, '');
        }
    };

    /**
     * Gets the closest node depending on its classname
     * @param node
     * @param classname
     */
    module.getClosestNode = function(node, classname)
    {
        while (node.className.search(classname) === -1)
        {
            node = node.parentNode;
        }
        return node;
    };

    window.DOM = module;

})(window, document);