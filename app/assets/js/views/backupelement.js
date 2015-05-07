(function(window, document)
{

    'use strict';

    var module = function()
    {

        var backupListTemplate = document.querySelector('.js-backup-list-template');
        var detailNodeTemplate = document.querySelector('.js-backup-detail-template');

        var itemNode = null;
        var detailNode = null;
        var toggleCallback = null;

        /**
         * Populates the object by using the given data (options, ect)
         * @param data
         */
        this.populate = function(data)
        {
            _initItemNode.apply(this, [data]);
            _initDetailNode.apply(this, [data]);
        };

        /**
         * Inits the item node (left panel)
         * @param data
         */
        var _initItemNode = function(data)
        {
            itemNode = document.createElement('div');
            itemNode.innerHTML = backupListTemplate.innerHTML;
            itemNode.className = backupListTemplate.getAttribute('rel');
            itemNode.addEventListener('click', this.toggleVisibility.bind(this));
        };

        /**
         * Inits the detail node (config, file tree, etc)
         * @param data
         */
        var _initDetailNode = function(data)
        {
            detailNode = document.createElement('form');
            detailNode.innerHTML = detailNodeTemplate.innerHTML;
            detailNode.className = detailNodeTemplate.getAttribute('rel');
            detailNode.style.display = 'none';
            for (var property in data)
            {
                var node = detailNode.querySelector('.js-field-' + property);
                if (node !== null)
                {
                    node.setAttribute('value', data[property]);
                }
            }
            detailNode.querySelector('.js-path-select').addEventListener('click', _onSelectDirectory.bind('this'));
        };

        /**
         * Returns the left panel node
         */
        this.getItemNode = function()
        {
            return itemNode;
        };

        /**
         * Returns the detail node
         */
        this.getDetailNode = function()
        {
            return detailNode;
        };

        /**
         * Registers a function to call when toggling the backup view
         * @param callback
         */
        this.onToggleVisibility = function(callback)
        {
            toggleCallback = callback;
        };

        /**
         * Toggles the backup view when clicking on an item of the left panel
         */
        this.toggleVisibility = function()
        {
            var is_visible = itemNode.className.search('js-active') !== -1;
            itemNode.className = is_visible ? itemNode.className.replace('js-active', '') : itemNode.className + ' js-active';
            detailNode.style.display = is_visible ? 'none' : 'block';
            if (toggleCallback !== null)
            {
                toggleCallback(this, !is_visible);
            }
        };

        /**
         * Selects a directory by using the native file dialog
         * @param evt
         */
        var _onSelectDirectory = function(evt)
        {
            evt.preventDefault();
            // @todo refactor this
            //ipc.send('select-directory', evt.currentTarget.parentNode.parentNode.parentNode.parentNode.parentNode.getAttribute('id'));
        };
    };

    window.BackupElement = module;

})(window, document);