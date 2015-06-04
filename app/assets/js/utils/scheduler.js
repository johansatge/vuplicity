/**
 * Scheduled tasks manager
 */
(function(require, m)
{

    'use strict';

    var module = function()
    {

        var scheduleCallback = null;

        /**
         * Sets the callback to be triggered when a scheduled event occurs
         * @param callback
         */
        this.onSchedule = function(callback)
        {
            scheduleCallback = callback;
        };

        /**
         * Parses and updates a list of scheduled tasks
         * @param schedules
         */
        this.setSchedules = function(schedules)
        {
            console.log('@todo update schedules if needed');
            console.log(schedules);
        };

    };

    m.exports = module;

})(require, module);