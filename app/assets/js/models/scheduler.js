/**
 * Scheduled tasks manager
 */
(function(require, m)
{

    'use strict';

    var Later = require('later');

    var module = function(callback)
    {

        var scheduleCallback = callback;
        var currentSchedules = [];

        /**
         * Parses and updates a list of scheduled tasks
         * @param schedules
         */
        this.setSchedules = function(schedules)
        {
            for (var index = 0; index < currentSchedules.length; index += 1)
            {
                currentSchedules[index].clear();
            }
            currentSchedules = [];
            for (index = 0; index < schedules.length; index += 1)
            {
                var schedule = schedules[index];
                var expression;
                if (schedule.interval_type === 'date')
                {
                    expression = 'at ' + schedule.date_hours + ':' + schedule.date_minutes;
                }
                if (schedule.interval_type === 'interval')
                {
                    if (schedule.interval_minutes < 60)
                    {
                        expression = 'every ' + schedule.interval_minutes + ' mins';
                    }
                    else
                    {
                        expression = 'every ' + (schedule.interval_minutes / 60) + ' hours';
                    }
                }
                var days;
                if (schedule.interval_basis === 'weekly')
                {
                    days = typeof schedule.weekdays.indexOf !== 'undefined' ? schedule.weekdays : [];
                    if (days.length === 0)
                    {
                        continue;
                    }
                    expression += ' on the ' + days.join(',') + ' day of the week';
                }
                if (schedule.interval_basis === 'monthly')
                {
                    days = typeof schedule.monthdays.indexOf !== 'undefined' ? schedule.monthdays : [];
                    if (days.length === 0)
                    {
                        continue;
                    }
                    expression += ' on the ' + days.join(',') + ' day of the month';
                }
                currentSchedules.push(Later.setInterval(_onSchedule.bind(this), Later.parse.text(expression)));
            }
        };

        /**
         * Reaches a schedule
         */
        var _onSchedule = function()
        {
            console.log('@todo trigger backup (return its type)');
            scheduleCallback();
        }

    };

    m.exports = module;

})(require, module);