/**
 * Schedules tab
 */
(function(window, document)
{

    'use strict';

    var itemTemplate = document.querySelector('.js-schedules-template');

    var module = function()
    {

        var schedulesNode = null;

        /**
         * Inits the tab
         * @param node
         */
        this.init = function(node)
        {
            schedulesNode = node;
            schedulesNode.querySelector('.js-add').addEventListener('click', _onAddSchedule.bind(this));
        };

        /**
         * Gets schedules
         */
        this.getSchedules = function()
        {
            var items = schedulesNode.querySelectorAll('.js-item');
            var schedules = [];
            for (var index = 0; index < items.length; index += 1)
            {
                var schedule = {};
                var options = items[index].querySelectorAll('.js-schedules-option');
                for (var opt_index = 0; opt_index < options.length; opt_index += 1)
                {
                    var option = options[opt_index];
                    if (option.getAttribute('type') === 'checkbox')
                    {
                        if (option.checked)
                        {
                            if (typeof schedule[option.getAttribute('name')] === 'undefined')
                            {
                                schedule[option.getAttribute('name')] = [];
                            }
                            schedule[option.getAttribute('name')].push(option.value);
                        }
                    }
                    else
                    {
                        schedule[option.getAttribute('name')] = option.value;
                    }
                }
                schedules.push(schedule);
            }
            return schedules;
        };

        /**
         * Updates schedules list
         * @param schedules
         */
        this.updateSchedules = function(schedules)
        {
            schedulesNode.querySelector('.js-items').innerHTML = '';
            for (var index = 0; index < schedules.length; index += 1)
            {
                _addSchedule.apply(this, [schedules[index]]);
            }
        };

        /**
         * Adds a new schedule
         * @param evt
         */
        var _onAddSchedule = function(evt)
        {
            evt.preventDefault();
            _addSchedule.apply(this, [{}]);
        };

        /**
         * Adds a new schedule and fills optional data
         * @param data
         */
        var _addSchedule = function(data)
        {
            var item = document.createElement('div');
            item.innerHTML = itemTemplate.innerHTML;
            item.className = itemTemplate.getAttribute('rel');
            schedulesNode.querySelector('.js-items').appendChild(item);

            for (var property in data)
            {
                if (typeof data[property] === 'string')
                {
                    var node = item.querySelector('.js-schedules-option[name="' + property + '"');
                    if (node !== null)
                    {
                        node.value = data[property];
                    }
                }
                else
                {
                    var nodes = item.querySelectorAll('.js-schedules-option[name="' + property + '"');
                    for (var index = 0; index < nodes.length; index += 1)
                    {
                        nodes[index].checked = data[property].indexOf(nodes[index].value) !== -1;
                    }
                }
            }

            item.querySelector('.js-remove').addEventListener('click', _onRemoveSchedule.bind(this));
            var toggles = item.querySelectorAll('.js-toggle');
            for (index = 0; index < toggles.length; index += 1)
            {
                toggles[index].addEventListener('change', _onToggle.bind(this));
                toggles[index].dispatchEvent(new Event('change'));
            }
        };

        /**
         * Toggles a select
         * @param evt
         */
        var _onToggle = function(evt)
        {
            var value = evt.currentTarget.value;
            var toggle_name = evt.currentTarget.getAttribute('rel');
            var items = DOM.getClosestNode(evt.currentTarget, 'js-item').querySelectorAll('.' + toggle_name);
            for (var index = 0; index < items.length; index += 1)
            {
                items[index].style.display = items[index].getAttribute('rel') === value ? 'block' : 'none';
            }
        };

        /**
         * Removes a schedule
         * @param evt
         */
        var _onRemoveSchedule = function(evt)
        {
            evt.preventDefault();
            var item = DOM.getClosestNode(evt.currentTarget, 'js-item');
            item.parentNode.removeChild(item);
        };

    };

    window.Schedules = module;

})(window, document);