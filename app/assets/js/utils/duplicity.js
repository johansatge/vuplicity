/**
 * Duplicity helper
 */
(function(require, m)
{

    'use strict';

    var exec = require('child_process').exec;
    var moment = require('moment');
    var os = require('os');
    var process = null;
    var cancelled = false;

    var module = function()
    {

        /**
         * Tries to get a file and save it on the given path
         * @param data
         * @param path
         * @param dest_path
         * @param callback
         */
        this.restoreFile = function(data, path, dest_path, callback)
        {
            var options = {env: {PASSPHRASE: data.passphrase, TMPDIR: os.tmpdir()}};
            var command = 'duplicity restore --file-to-restore "' + path + '" "' + data.url + '" "' + dest_path + '"' + ' ' + data.options;
            process = exec(command, options, function(error, stdout, stderr)
            {
                callback(_parseError.apply(this, [stderr]));
            });
        };

        /**
         * Tries to restore a backup
         * @param data
         * @param dest_path
         * @param callback
         */
        this.restoreTree = function(data, dest_path, callback)
        {
            var options = {env: {PASSPHRASE: data.passphrase, TMPDIR: os.tmpdir()}};
            var command = 'duplicity restore "' + data.url + '" "' + dest_path + '"' + ' ' + data.options;
            process = exec(command, options, function(error, stdout, stderr)
            {
                callback(_parseError.apply(this, [stderr]));
            });
        };

        /**
         * Lists the current files in a backup
         * @param data
         * @param callback
         */
        this.getFiles = function(data, callback)
        {
            var options = {env: {PASSPHRASE: data.passphrase, TMPDIR: os.tmpdir()}};
            process = exec('duplicity list-current-files ' + data.url + ' ' + data.options, options, function(error, stdout, stderr)
            {
                var regex = /[a-zA-Z]{3}.*[0-9]{4} (.*)\n/gm;
                var tree = [];
                var match;
                while (match = regex.exec(stdout))
                {
                    if (match[1] !== 'undefined')
                    {
                        var path = match[1];
                        if (path === '.' || path === '..')
                        {
                            continue;
                        }
                        tree.push({
                            path: path,
                            dir: path.search('/') !== -1 ? path.substring(0, path.lastIndexOf('/')) : '.',
                            name: path.substring(path.lastIndexOf('/') + 1)
                        });
                    }
                }
                callback(_parseError.apply(this, [stderr]), tree);
            });
        };

        /**
         * Gets the current status of a backup
         * @param data
         * @param callback
         */
        this.getStatus = function(data, callback)
        {
            var options = {env: {PASSPHRASE: data.passphrase, TMPDIR: os.tmpdir()}};
            process = exec('duplicity collection-status ' + data.url + ' ' + data.options, options, function(error, stdout, stderr)
            {
                var data = {};
                var chain_start_time = new RegExp('Chain start time: ([^\n]+)', 'gm').exec(stdout);
                var chain_end_time = new RegExp('Chain end time: ([^\n]+)', 'gm').exec(stdout);
                var backup_sets = new RegExp('Number of contained backup sets: ([0-9]+)', 'gm').exec(stdout);
                data.chain_start_time = chain_start_time !== null && typeof chain_start_time[1] !== 'undefined' ? Date.parse(chain_start_time[1]) : '';
                data.chain_end_time = chain_end_time !== null && typeof chain_end_time[1] !== 'undefined' ? Date.parse(chain_end_time[1]) : '';
                data.backup_sets = backup_sets !== null && typeof backup_sets[1] !== 'undefined' ? backup_sets[1] : '';
                data.chain_start_time = data.chain_start_time !== '' ? moment(data.chain_start_time).format('YYYY-MM-DD HH:mm') : '';
                data.chain_end_time = data.chain_end_time !== '' ? moment(data.chain_end_time).format('YYYY-MM-DD HH:mm') : '';
                callback(_parseError.apply(this, [stderr]), data);
            });
        };

        /**
         * Kills the current process
         */
        this.cancel = function()
        {
            cancelled = true;
            process.kill('SIGTERM');
        };

        /**
         * Parses an error message
         * @param stderr
         */
        var _parseError = function(stderr)
        {
            if (cancelled)
            {
                return 'User has cancelled.';
            }
            return stderr.replace(/[ \n\t]*/gm, '').length > 0 ? stderr.replace(/\n/g, '<br>') : false;
        };

    };

    m.exports = module;

})(require, module);