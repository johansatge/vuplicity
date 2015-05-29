/**
 * Filetree view (in a backup item)
 */
(function(window, document)
{

    'use strict';

    var treeNodeTemplate = document.querySelector('.js-backup-filetree-template');

    var module = function()
    {

        var treeNode = null;
        var restoreCallback = null;

        /**
         * Inits the tree
         * @param node
         * @param restore_callback
         */
        this.init = function(node, restore_callback)
        {
            treeNode = node;
            restoreCallback = restore_callback;
            treeNode.addEventListener('click', _onClick.bind(this));
        };

        /**
         * Updates the tree
         * @param tree
         */
        this.update = function(tree)
        {
            var current_dir_node = treeNode;
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
         * Handles clicks on the file tree
         * @param evt
         */
        var _onClick = function(evt)
        {
            evt.preventDefault();
            if (evt.target.className.search('js-restore') !== -1)
            {
                restoreCallback(evt.target.parentNode.parentNode.getAttribute('rel'));
            }
            if (evt.target.className.search('js-toggle') !== -1)
            {
                _toggleNode.apply(this, [evt.target.parentNode]);
            }
        };

        /**
         * Toggles the given tree
         * @param tree_node
         */
        var _toggleNode = function(tree_node)
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

    window.FileTree = module;

})(window, document);