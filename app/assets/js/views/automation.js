/**
 * Automation tab
 */
(function(window, document)
{

    'use strict';

    var itemTemplate = document.querySelector('.js-automation-template');

    var module = function()
    {

        var automationNode = null;

        /**
         * Inits the tab
         * @param node
         */
        this.init = function(node)
        {
            automationNode = node;
            automationNode.querySelector('.js-add').addEventListener('click', _onAddRule.bind(this));
        };

        /**
         * Gets automation rules
         */
        this.getRules = function()
        {
            var items = automationNode.querySelectorAll('.js-item');
            var rules = [];
            for (var index = 0; index < items.length; index += 1)
            {
                var rule = {};
                var options = items[index].querySelectorAll('.js-automation-option');
                for (var opt_index = 0; opt_index < options.length; opt_index += 1)
                {
                    var option = options[opt_index];
                    if (option.getAttribute('type') === 'checkbox')
                    {
                        if (option.checked)
                        {
                            if (typeof rule[option.getAttribute('name')] === 'undefined')
                            {
                                rule[option.getAttribute('name')] = [];
                            }
                            rule[option.getAttribute('name')].push(option.value);
                        }
                    }
                    else
                    {
                        rule[option.getAttribute('name')] = option.value;
                    }
                }
                rules.push(rule);
            }
            return rules;
        };

        /**
         * Updates rules set
         * @param rules
         */
        this.updateRules = function(rules)
        {
            automationNode.querySelector('.js-items').innerHTML = '';
            for (var index = 0; index < rules.length; index += 1)
            {
                _addRule.apply(this, [rules[index]]);
            }
        };

        /**
         * Adds a new rule
         * @param evt
         */
        var _onAddRule = function(evt)
        {
            evt.preventDefault();
            _addRule.apply(this, [{}]);
        };

        /**
         * Adds a new rule and fills optional data
         * @param data
         */
        var _addRule = function(data)
        {
            var item = document.createElement('div');
            item.innerHTML = itemTemplate.innerHTML;
            item.className = itemTemplate.getAttribute('rel');
            automationNode.querySelector('.js-items').appendChild(item);

            for (var property in data)
            {
                if (typeof data[property] === 'string')
                {
                    var node = item.querySelector('.js-automation-option[name="' + property + '"');
                    if (node !== null)
                    {
                        node.value = data[property];
                    }
                }
                else
                {
                    var nodes = item.querySelectorAll('.js-automation-option[name="' + property + '"');
                    for (var index = 0; index < nodes.length; index += 1)
                    {
                        nodes[index].checked = data[property].indexOf(nodes[index].value) !== -1;
                    }
                }
            }

            item.querySelector('.js-remove').addEventListener('click', _onRemoveRule.bind(this));
            var toggles = item.querySelectorAll('.js-toggle');
            for (var index = 0; index < toggles.length; index += 1)
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
            var items = _closest.apply(this, [evt.currentTarget, 'js-item']).querySelectorAll('.' + toggle_name);
            for (var index = 0; index < items.length; index += 1)
            {
                items[index].style.display = items[index].getAttribute('rel') === value ? 'block' : 'none';
            }
        };

        /**
         * Removes a rule
         * @param evt
         */
        var _onRemoveRule = function(evt)
        {
            evt.preventDefault();
            var item = evt.currentTarget.parentNode.parentNode;
            item.parentNode.removeChild(item);
        };

        /**
         * Gets the closest node depending on the given classname
         * @param node
         * @param classname
         */
        var _closest = function(node, classname)
        {
            while (node.className.search(classname) === -1)
            {
                node = node.parentNode;
            }
            return node;
        };

    };

    window.Automation = module;

})(window, document);