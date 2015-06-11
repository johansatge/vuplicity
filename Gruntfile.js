module.exports = function(grunt)
{

    'use strict';

    var fs = require('fs');
    var exec = require('child_process').exec;
    var argv = require('yargs').argv;
    var manifest = JSON.parse(fs.readFileSync('app/package.json', {encoding: 'utf8'}));
    var packager = require('electron-packager');
    process.env.TMPDIR = __dirname + '/.build/tmp';

    /**
     * SASS watcher
     */
    grunt.registerTask('sass', function()
    {
        var done = this.async();
        var child = exec('cd app/assets && compass watch sass/controlpanel.scss');
        child.stdout.on('data', grunt.log.write);
        child.stderr.on('data', grunt.log.write);
        child.on('close', done);
    });

    /**
     * Runs the app
     */
    grunt.registerTask('run', function()
    {
        var done = this.async();
        var show_devtools = argv.devtools ? ' --devtools' : '';
        var override_config = argv.configpath ? ' --configpath=' + argv.configpath : '';
        var child = exec('electron app' + show_devtools + override_config);
        child.stdout.on('data', grunt.log.write);
        child.stderr.on('data', grunt.log.write);
        child.on('close', done);
    });

    /**
     * Builds apps for Linux, Windows, OSX
     */
    grunt.registerTask('build', function()
    {
        var done = this.async();
        var platforms = ['linux', 'win32', 'darwin'];
        var built_platforms = 0;
        platforms.map(function(platform)
        {
            var options = {
                'dir': 'app',
                'name': manifest.name,
                'app-version': manifest.version,
                'app-bundle-id': manifest.bundle_id,
                'helper-bundle-id': manifest.helper_bundle_id,
                'version': manifest.electron_version,
                'arch': 'x64',
                'platform': platform,
                'out': '.build/' + platform,
                'icon': 'icon.png'
            };
            exec('rm -rf .build/' + platform, function()
            {
                packager(options, function(error, app_path)
                {
                    grunt.log.writeln(error ? error : 'Built ' + app_path);
                    built_platforms += 1;
                    if (built_platforms >= platforms.length)
                    {
                        done();
                    }
                });
            });
        });
    });

};