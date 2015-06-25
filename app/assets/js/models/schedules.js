/**
 * Scheduled tasks manager
 */
(function(require, m)
{

    'use strict';

    var Later = require('later');
    var moment = require('moment');
    Later.date.localTime();

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
            currentSchedules.map(function(data)
            {
                data.interval.clear();
            });
            currentSchedules = [];
            for (var index = 0; index < schedules.length; index += 1)
            {
                var interval = _parseScheduleInterval.apply(this, [schedules[index]]);
                var days = _parseScheduleDays.apply(this, [schedules[index]]);
                if (interval !== false && days !== false)
                {
                    var instance = Later.parse.text(interval + ' ' + days);
                    var callback = schedules[index].backup_type === 'full' ? _onScheduleFull : _onScheduleAuto;
                    currentSchedules.push({
                        interval: Later.setInterval(callback.bind(this), instance),
                        instance: Later.schedule(instance)
                    });
                }
            }
        };

        /**
         * Gets the closest, next occurrence
         */
        this.getNext = function()
        {
            var times = [];
            for (var index = 0; index < currentSchedules.length; index += 1)
            {
                times.push(moment(currentSchedules[index].instance.next(1)).unix());
            }
            if (times.length > 0)
            {
                return moment().to(moment.unix(Math.min.apply(Math, times)));
            }
            return 'never';
        };

        /**
         * Reads the requested interval (specific time in the day, or time intervals)
         * @param schedule
         */
        var _parseScheduleInterval = function(schedule)
        {
            if (schedule.interval_type === 'date')
            {
                return 'at ' + schedule.date_hours + ':' + schedule.date_minutes;
            }
            else if (schedule.interval_type === 'interval')
            {
                var minutes = schedule.interval_minutes;
                return minutes < 60 ? 'every ' + minutes + ' mins' : 'every ' + (minutes / 60) + ' hours';
            }
        };

        /**
         * Reads the requested planning (days of month or week)
         * @param schedule
         */
        var _parseScheduleDays = function(schedule)
        {
            if (schedule.interval_basis === 'weekly')
            {
                if (typeof schedule.weekdays.indexOf === 'undefined' || schedule.weekdays.length === 0)
                {
                    return false;
                }
                return 'on the ' + schedule.weekdays.sort().join(',') + ' day of the week';
            }
            else if (schedule.interval_basis === 'monthly')
            {
                if (typeof schedule.monthdays.indexOf === 'undefined' || schedule.monthdays.length === 0)
                {
                    return false;
                }
                return 'on the ' + schedule.monthdays.join(',') + ' day of the month';
            }
        };

        /**
         * Reaches a schedule
         */
        var _onScheduleFull = function()
        {
            scheduleCallback('full');
        };

        /**
         * Reaches a schedule
         */
        var _onScheduleAuto = function()
        {
            scheduleCallback('auto');
        };

    };

    m.exports = module;

})(require, module);