/**
 * Scheduled tasks manager
 */
(function(require, m)
{

    'use strict';

    var module = function(callback)
    {

        var scheduleCallback = callback;
        var plannedSchedules = null;
        var lastBackupDate = null;
        var throttle = null;

        /**
         * Parses and updates a list of scheduled tasks
         * @param schedules
         */
        this.setSchedules = function(schedules)
        {
            plannedSchedules = schedules;
            lastBackupDate = new Date();
            throttle = setInterval(_checkSchedules.bind(this), 5000);
            _checkSchedules.apply(this);
        };

        /**
         * Checks schedules list
         */
        var _checkSchedules = function()
        {
            for (var index = 0; index < plannedSchedules.length; index += 1)
            {
                _checkSchedule.apply(this, [plannedSchedules[index]]);
            }
        };

        /**
         * Checks a schedule by comparing its settings with the last backup date
         * @param schedule
         */
        var _checkSchedule = function(schedule)
        {
            if (!_isInIntervalBasis.apply(this, [schedule]))
            {
                return;
            }
            if (schedule.interval_type === 'date')
            {
                console.log('@todo check given date');
                // schedule.date_hours;
                // schedule.date_minutes;
            }
            if (schedule.interval_type === 'interval')
            {
                console.log('@todo check given interval');
                // schedule.interval_minutes;
            }
        };

        /**
         * Checks the date basis (monthdays, weekdays)
         * @param schedule
         */
        var _isInIntervalBasis = function(schedule)
        {
            var days;
            if (schedule.interval_basis === 'weekly')
            {
                days = typeof schedule.weekdays.indexOf !== 'undefined' ? schedule.weekdays : [];
                return days.indexOf('' + lastBackupDate.getDay()) !== -1;
            }
            if (schedule.interval_basis === 'monthly')
            {
                days = typeof schedule.monthdays.indexOf !== 'undefined' ? schedule.monthdays : [];
                return days.indexOf('' + lastBackupDate.getDate()) !== -1;
            }
            return true;
        };

    };

    m.exports = module;

})(require, module);