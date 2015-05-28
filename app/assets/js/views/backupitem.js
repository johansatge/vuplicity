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
        var treeNodeTemplate = document.querySelector('.js-backup-filetree-template');

        var id = backup_id;
        var itemNode = null;
        var detailNode = null;
        var toggleCallback = null;
        var actionCallback = null;
        var currentTab = null;

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
        };

        /**
         * Updates file tree
         * @param tree
         */
        this.updateFileTree = function(tree)
        {
            var current_dir_node = detailNode.querySelector('.js-file-tree');
            current_dir_node.innerHTML = '';
            var current_hierarchy = ['.'];
            for (var index = 0; index < tree.length; index += 1)
            {
                var file = tree[index];
                var file_node = document.createElement('li');
                current_dir_node.appendChild(file_node);
                file_node.className += ' js-file';
                file_node.innerHTML = treeNodeTemplate.innerHTML.replace('{{name}}', file.name);
                file_node.setAttribute('rel', file.path);
                if (index < tree.length - 1)
                {
                    var next_file = tree[index + 1];
                    if (next_file.dir !== current_hierarchy[current_hierarchy.length - 1])
                    {
                        if (current_hierarchy.indexOf(next_file.dir) === -1)
                        {
                            var subdir_node = document.createElement('ul');
                            file_node.appendChild(subdir_node);
                            file_node.className += ' js-dir';
                            current_dir_node = subdir_node;
                            current_hierarchy.push(next_file.dir);
                        }
                        else
                        {
                            while (next_file.dir !== current_hierarchy[current_hierarchy.length - 1])
                            {
                                current_dir_node = current_dir_node.parentNode.parentNode;
                                current_hierarchy.pop();
                            }
                        }
                    }
                }
            }
        };

        /**
         * Updates backup status
         * @param data
         */
        this.updateStatus = function(data)
        {
            for (var property in data)
            {
                var node = detailNode.querySelector('.js-status[rel="' + property + '"');
                if (node !== null)
                {
                    node.innerHTML = data[property].length > 0 ? data[property] : '--';
                }
                if (property === 'chain_end_time')
                {
                    itemNode.querySelector('.js-last-update').innerHTML = data[property].length > 0 ? data[property] : '--';
                }
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
         * @param message
         * @param has_error
         */
        this.toggleProcessingStatus = function(is_processing, message, has_error)
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
            if (typeof message !== 'undefined')
            {
                itemNode.querySelector('.js-process-message').innerHTML = message;
            }
            if (has_error)
            {
                itemNode.className += ' js-error';
            }
            else
            {
                itemNode.className = itemNode.className.replace('js-error', '');
            }
        };

        /**
         * Checks if the backup is processing a task
         */
        this.isProcessing = function()
        {
            return itemNode.className.search('js-processing') !== -1;
        };

        /**
         * Clears the item history
         */
        this.clearHistory = function()
        {
            detailNode.querySelector('.js-history').innerHTML = '';
            itemNode.className = itemNode.className.replace('js-error', '');
        };

        /**
         * Updates history
         * @param history
         */
        this.updateHistory = function(history)
        {
            if (history.search(/\n$/g) === -1)
            {
                history += '\n';
            }
            var node = detailNode.querySelector('.js-history');
            node.innerHTML += history;
            node.scrollTop = node.scrollHeight - node.offsetHeight;
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
            itemNode.querySelector('.js-cancel').addEventListener('click', _onCancelCurrentProcess.bind(this));
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
            detailNode.querySelector('.js-file-tree').addEventListener('click', _onFileTreeClick.bind(this));
            var actions = detailNode.querySelectorAll('.js-action');
            for (var index = 0; index < actions.length; index += 1)
            {
                actions[index].addEventListener('click', _onTriggerAction.bind(this));
            }
            var sections = detailNode.querySelectorAll('.js-section');
            for (index = 0; index < sections.length; index += 1)
            {
                sections[index].style.display = 'none';
            }
            var tabs = detailNode.querySelectorAll('.js-tab');
            for (index = 0; index < tabs.length; index += 1)
            {
                tabs[index].addEventListener('click', _onTabClick.bind(this));
            }
        };

        /**
         * Clicks on a tab
         * @param evt
         */
        var _onTabClick = function(evt)
        {
            evt.preventDefault();
            var tab = evt.currentTarget;
            if (tab.className.search('js-active') === -1)
            {
                if (currentTab !== null)
                {
                    currentTab.tab.className = currentTab.tab.className.replace('js-active', '');
                    currentTab.section.style.display = 'none';
                }
                currentTab = {};
                currentTab.tab = evt.currentTarget;
                currentTab.section = detailNode.querySelector('.js-section[rel="' + evt.currentTarget.getAttribute('rel') + '"]');
                currentTab.tab.className += ' js-active';
                currentTab.section.style.display = 'block';
            }
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
         * Stops the currently running task
         * @param evt
         */
        var _onCancelCurrentProcess = function(evt)
        {
            evt.preventDefault();
            evt.stopPropagation();
            actionCallback('cancel-process', id);
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
         * Starts an action when using one of the detail buttons
         * @param evt
         */
        var _onTriggerAction = function(evt)
        {
            evt.preventDefault();
            evt.stopPropagation();
            actionCallback(evt.currentTarget.getAttribute('rel'), id, _getCurrentOptions.apply(this));
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
         * Handles clicks on the file tree
         * @param evt
         */
        var _onFileTreeClick = function(evt)
        {
            evt.preventDefault();
            if (evt.target.className.search('js-restore') !== -1)
            {
                actionCallback('restore-file', id, evt.target.parentNode.parentNode.getAttribute('rel'));
            }
            if (evt.target.className.search('js-toggle') !== -1)
            {
                _toggleFileTreeNode.apply(this, [evt.target.parentNode]);
            }
        };

        /**
         * Toggles the given tree
         * @param tree_node
         */
        var _toggleFileTreeNode = function(tree_node)
        {
            var child_list = tree_node.querySelector('ul');
            if (child_list !== null)
            {
                if (child_list.style.display === 'none')
                {
                    child_list.style.display = 'block';
                    tree_node.className = tree_node.className.replace('js-closed', '');
                }
                else
                {
                    child_list.style.display = 'none';
                    tree_node.className += ' js-closed';
                }
            }
        };

    };

    window.BackupItem = module;

})(window, document);