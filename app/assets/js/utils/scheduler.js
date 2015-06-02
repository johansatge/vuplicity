/**
 * Scheduled tasks
 */
(function(require, m)
{

    'use strict';

    var module = {};

    var scheduleCallback = null;

    /**
     * Event manager
     * @param callback
     */
    module.onScheduledEvent = function(callback)
    {
        scheduleCallback = callback;
    };

    /**
     * Parses and updates the scheduled tasks of a backup
     * @param id
     * @param data
     */
    module.updateBackup = function(id, data)
    {
        console.log('@todo update backup schedules if needed');
    };

    m.exports = module;

})(require, module);