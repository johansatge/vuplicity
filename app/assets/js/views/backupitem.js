/**
 * Manages a backup item in the control panel
 * An item is made of a node in the list view (left panel) and a detailed view (with the file tree, backup status, etc)
 */
(function(window, document)
{

    'use strict';

    var module = function(backup_id)
    {

        var backupListTemplate = document.querySelector('.js-backup-list-template');
        var detailNodeTemplate = document.querySelector('.js-backup-detail-template');

        var id = backup_id;
        var itemNode = null;
        var detailNode = null;
        var errorNode = null;
        var toggleCallback = null;
        var actionCallback = null;

        /**
         * Inits the item
         * @param toggle_callback
         * @param action_callback
         */
        this.init = function(toggle_callback, action_callback)
        {
            toggleCallback = toggle_callback;
            actionCallback = action_callback;
            _initItemNode.apply(this);
            _initDetailNode.apply(this);
            _initErrors.apply(this);
        };

        /**
         * Updates backup status
         * @param data
         * @param error
         */
        this.updateStatus = function(data, error)
        {
            for (var property in data)
            {
                var node = detailNode.querySelector('.js-status[rel="' + property + '"');
                if (node !== null)
                {
                    node.innerHTML = data[property].length > 0 ? data[property] : '--';
                }
            }
            if (error === false)
            {
                errorNode.style.display = 'none';
            }
            else
            {
                errorNode.querySelector('.js-error-message').innerHTML = error;
                errorNode.style.display = 'block';
            }
        };

        /**
         * Updates backup options
         * @param data
         */
        this.updateOptions = function(data)
        {
            for (var property in data)
            {
                var node = detailNode.querySelector('.js-option[rel="' + property + '"');
                if (node !== null)
                {
                    node.setAttribute('value', data[property]);
                }
            }
            itemNode.querySelector('.js-title').innerHTML = typeof data.title !== 'undefined' ? data.title : 'Unnamed backup';
        };

        /**
         * Sets the processing status of the backup (displays a loader)
         * @param is_processing
         */
        this.toggleProcessingStatus = function(is_processing)
        {
            if (is_processing)
            {
                itemNode.className = itemNode.className + ' js-processing';
                detailNode.className = detailNode.className + ' js-processing';
            }
            else
            {
                itemNode.className = itemNode.className.replace('js-processing', '');
                detailNode.className = detailNode.className.replace('js-processing', '');
            }
        };

        /**
         * Inits the item node (left panel)
         */
        var _initItemNode = function()
        {
            itemNode = document.createElement('div');
            itemNode.innerHTML = backupListTemplate.innerHTML;
            itemNode.className = backupListTemplate.getAttribute('rel');
            itemNode.addEventListener('click', this.toggleVisibility.bind(this));

        };

        /**
         * Inits the detail node (config, file tree, etc)
         */
        var _initDetailNode = function()
        {
            detailNode = document.createElement('form');
            detailNode.innerHTML = detailNodeTemplate.innerHTML;
            detailNode.className = detailNodeTemplate.getAttribute('rel');
            detailNode.style.display = 'none';

            detailNode.querySelector('.js-select-dir').addEventListener('click', _onSelectDirectory.bind(this));
            detailNode.querySelector('.js-actions').addEventListener('click', _onTriggerAction.bind(this));
        };

        /**
         * Inits error messages
         */
        var _initErrors = function()
        {
            errorNode = detailNode.querySelector('.js-error');
            errorNode.querySelector('.js-error-close').addEventListener('click', _onCloseError.bind(this));
            errorNode.style.display = 'none';
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
         * Toggles the backup view when clicking on an item of the left panel
         */
        this.toggleVisibility = function()
        {
            var is_visible = itemNode.className.search('js-active') !== -1;
            itemNode.className = is_visible ? itemNode.className.replace('js-active', '') : itemNode.className + ' js-active';
            detailNode.style.display = is_visible ? 'none' : 'block';
            if (toggleCallback !== null)
            {
                toggleCallback(id, !is_visible);
            }
        };

        /**
         * Gets the currently filled options
         */
        var _getCurrentOptions = function()
        {
            var options = detailNode.querySelectorAll('.js-option');
            var data = {};
            for (var index = 0; index < options.length; index += 1)
            {
                data[options[index].getAttribute('rel')] = options[index].value;
            }
            return data;
        };

        /**
         * Starts an action when using the toolbar of the detail view
         * @param evt
         */
        var _onTriggerAction = function(evt)
        {
            evt.preventDefault();
            var action = evt.target.getAttribute('rel');
            actionCallback(action, id, _getCurrentOptions.apply(this));
        };

        /**
         * Selects a directory by using the icon in the related field
         * @param evt
         */
        var _onSelectDirectory = function(evt)
        {
            evt.preventDefault();
            actionCallback('select-directory', id, _getCurrentOptions.apply(this));
        };

        /**
         * Closes the error message
         * @param evt
         */
        var _onCloseError = function(evt)
        {
            evt.preventDefault();
            errorNode.style.display = 'none';
        };


    };

    window.BackupItem = module;

})(window, document);