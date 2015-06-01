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
            automationNode.querySelector('.js-save').addEventListener('click', _onSaveRules.bind(this));
            automationNode.querySelector('.js-add').addEventListener('click', _onAddRule.bind(this));
        };

        /**
         * Saves automation rules
         * @param evt
         */
        var _onSaveRules = function(evt)
        {
            evt.preventDefault();
            console.log('@todo save');
        };

        /**
         * Adds a new rule
         * @param evt
         */
        var _onAddRule = function(evt)
        {
            evt.preventDefault();
            var item = document.createElement('div');
            item.innerHTML = itemTemplate.innerHTML;
            item.className = itemTemplate.getAttribute('rel');
            automationNode.querySelector('.js-items').appendChild(item);
            var basis = item.querySelector('.js-basis');
            basis.addEventListener('change', _onUpdateRuleBasis.bind(this));
            basis.dispatchEvent(new Event('change'));
            item.querySelector('.js-remove').addEventListener('click', _onRemoveRule.bind(this));
        };

        /**
         * Updates rule basis (weekly, monthly, ...)
         * @param evt
         */
        var _onUpdateRuleBasis = function(evt)
        {
            var basis = evt.currentTarget.value;
            var choices = evt.currentTarget.parentNode.parentNode.parentNode.querySelectorAll('.js-basis-target');
            for (var index = 0; index < choices.length; index += 1)
            {
                choices[index].style.display = choices[index].getAttribute('rel') === basis ? 'block' : 'none';
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

    };

    window.Automation = module;

})(window, document);