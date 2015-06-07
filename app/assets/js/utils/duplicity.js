/**
 * Duplicity CLI helper
 * Used in the backup model
 */
(function(require, m)
{

    'use strict';

    var exec = require('child_process').exec;
    var moment = require('moment');
    var os = require('os');
    var process = null;
    var cancelled = false;
    var outputCallback = null;

    var module = function()
    {

        /**
         * Checks if a process is running
         */
        this.isProcessing = function()
        {
            return process !== null;
        };

        /**
         * Registers a callback to be triggered when an output is received from the CLI tool
         * @param callback
         */
        this.onOutput = function(callback)
        {
            outputCallback = callback;
        };

        /**
         * Starts a backup task
         * @param data
         * @param type (full | "")
         * @param callback
         */
        this.doBackup = function(data, type, callback)
        {
            var options = {env: {PASSPHRASE: data.passphrase, TMPDIR: os.tmpdir()}};
            var command = 'duplicity ' + type + ' "' + data.path + '" "' + data.url + '" ' + data.cli_options + ' --verbosity info';
            process = exec(command, options, function(error, stdout, stderr)
            {
                process = null;
                callback(_parseError.apply(this, [stderr]));
            });
            process.stdout.on('data', outputCallback);
            process.stderr.on('data', outputCallback);
        };

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
            var command = 'duplicity restore --file-to-restore "' + path + '" "' + data.url + '" "' + dest_path + '"' + ' ' + data.cli_options + ' --verbosity info';
            process = exec(command, options, function(error, stdout, stderr)
            {
                process = null;
                callback(_parseError.apply(this, [stderr]));
            });
            process.stdout.on('data', outputCallback);
            process.stderr.on('data', outputCallback);
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
            var command = 'duplicity restore "' + data.url + '" "' + dest_path + '"' + ' ' + data.cli_options + ' --verbosity info';
            process = exec(command, options, function(error, stdout, stderr)
            {
                process = null;
                callback(_parseError.apply(this, [stderr]));
            });
            process.stdout.on('data', outputCallback);
            process.stderr.on('data', outputCallback);
        };

        /**
         * Lists the current files in a backup
         * @param data
         * @param callback
         */
        this.getFiles = function(data, callback)
        {
            var options = {env: {PASSPHRASE: data.passphrase, TMPDIR: os.tmpdir()}};
            var command = 'duplicity list-current-files ' + data.url + ' ' + data.cli_options + ' --verbosity info';
            process = exec(command, options, function(error, stdout, stderr)
            {
                var regex = /^[a-zA-Z]{3} [a-zA-Z]{3} [0-9 :]+(.*)$/gm;
                var tree = [];
                var match;
                while (match = regex.exec(stdout))
                {
                    if (match[1] !== 'undefined')
                    {
                        var path = match[1];
                        if (path !== '.' && path !== '..')
                        {
                            tree.push({
                                path: path,
                                dir: path.search('/') !== -1 ? path.substring(0, path.lastIndexOf('/')) : '.',
                                name: path.substring(path.lastIndexOf('/') + 1)
                            });
                        }
                    }
                }
                process = null;
                callback(_parseError.apply(this, [stderr]), tree);
            });
            process.stdout.on('data', outputCallback);
            process.stderr.on('data', outputCallback);
        };

        /**
         * Gets the current status of a backup
         * @param data
         * @param callback
         */
        this.getStatus = function(data, callback)
        {
            var options = {env: {PASSPHRASE: data.passphrase, TMPDIR: os.tmpdir()}};
            var command = 'duplicity collection-status ' + data.url + ' ' + data.cli_options + ' --verbosity info';
            process = exec(command, options, function(error, stdout, stderr)
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
                process = null;
                callback(_parseError.apply(this, [stderr]), data);
            });
            process.stdout.on('data', outputCallback);
            process.stderr.on('data', outputCallback);
        };

        /**
         * Kills the current process
         */
        this.cancel = function()
        {
            cancelled = true;
            process.kill('SIGINT');
        };

        /**
         * Parses an error message
         * @param stderr
         */
        var _parseError = function(stderr)
        {
            if (cancelled)
            {
                cancelled = false;
                return 'User has cancelled.';
            }
            return stderr.replace(/[ \n\t]*/gm, '').length > 0 ? stderr.replace(/\n/g, '<br>') : false;
        };

    };

    m.exports = module;

})(require, module);