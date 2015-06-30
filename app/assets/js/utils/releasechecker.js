/**
 * Checks available releases
 */
(function(require, m)
{

    'use strict';

    var Request = require('request');
    var CompareVersions = require('compare-versions');
    var dialog = require('dialog');
    var shell = require('shell');

    var module = function(currentVersion, apiURL)
    {

        this.checkLastRelease = function()
        {
            var options = {url: apiURL, headers: {'User-Agent': 'request'}, json: true};
            Request(options, _onAPIAnswer.bind(this));
        };

        var _onAPIAnswer = function(error, response, last_release)
        {
            if (error || typeof last_release !== 'object')
            {
                return;
            }
            var latest_version = new RegExp('^v([0-9]\.[0-9]\.[0-9])$', 'g').exec(last_release.tag_name);
            if (latest_version !== null && typeof latest_version[1] !== 'undefined')
            {
                if (CompareVersions(latest_version[1], currentVersion) > 0)
                {
                    _showDialog.apply(this, [last_release.name, last_release.body, last_release.html_url]);
                }
            }
        };

        var _showDialog = function(name, description, url)
        {
            var options = {
                type: 'info',
                buttons: ['Visit website', 'Dismiss'],
                message: 'A new version is available',
                detail: name + '\n' + new Array(name.length + 1).join('-') + '\n' + description
            };
            dialog.showMessageBox(options, function(response)
            {
                if (response === 0)
                {
                    shell.openExternal(url);
                }
            });
        };

    };

    m.exports = module;

})(require, module);