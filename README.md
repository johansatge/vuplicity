# Vuplicity

A cross-platform GUI for Duplicity backups, powered by Atom Electron.

[Installation](#installation) | [Features](#features) | [Todos & caveats](#todos) | [Changelog](#changelog) | [License](#license) | [Credits](#credits)
--- | --- | --- | --- | --- | ---

![Vuplicity](https://raw.github.com/johansatge/vuplicity/master/screenshot.png)

<a id="installation"></a>
## Installation

*Sorry, no prebuilt binaries for now...*

**1.** Install [Duplicity](http://duplicity.nongnu.org/) if needed

(Ensure it is included in your global `$PATH` to allow the app to access it)

**2.** Install [node.js](https://nodejs.org/) and [npm](https://github.com/npm/npm) if needed

**3.** Install [Atom Electron](http://electron.atom.io/) if needed

```
npm install electron-prebuilt -g
```

**4.** Get the project and its dependencies

```
git clone https://github.com/johansatge/vuplicity.git
```

```
cd vuplicity/app && npm install
```

**5.** Run

```
electron . &
```

<a id="features"></a>
## Features

The GUI works directly with Duplicity by sending shell commands, so you can use your existing backups and / or create new ones independently.

You can do most of the things duplicity provide:

1. Check the status of a backup
2. Start a full or incremental backup
3. Restore the backup to the specified location
4. Browse the backup files
5. Restore a single file to the specified location

![Features](https://raw.github.com/johansatge/vuplicity/master/screenshot-features.png)

The configuration of the GUI is stored in the following file: `~/.vuplicity`. Its content looks like this:

```json
{
    "backups": {
        "b-1432822302303": {
            "options": "",
            "passphrase": "123456789387648",
            "path": "/Volumes/Data/Movies",
            "title": "Movies",
            "url": "dpbox:///Movies"
        },
        "b-1432822336034": {
            "options": "",
            "passphrase": "",
            "path": "",
            "title": "Pictures",
            "url": ""
        }
    }
}
```

If you need to give duplicity custom CLI parameters, you can do so in the `Options` fields of the `Settings` tab.

<a id="todos"></a>
## Todos & caveats

### Automation *(next planned feature)*

Automatically start backups at defined intervals.

It will probably look like a list of configurable intervals proividing the following fields:

* Frequency (each day at XX hour, each XX minutes, etc)
* Backup type (full or incremental)
* Confirmation email (?)

### Updated progressbar

Display the progression of a backup by using the `--progress` Duplicity option.

*On my machine the progress does not show when using the cli tool, I'm a victim of the [ETA stalled bug](https://www.google.com/#q=duplicity+eta+stalled) - I will have to figure out why, before being able to develop this.*

### Fix unsecure passphrases

Passphrases are stored in clear text in the configuration file.

It may be nice to encrypt the file and ask for the password when starting the GUI.

### Interactive CLI

For now, there is no way to interact with the CLI tool.

For instance, when using the Dropbox backend, you have to load an authorization URL, and then tell the script to continue.

This step has to be executed manually; when it's done, you will be able to use the GUI.

<a id="changelog"></a>
## Changelog

Version | Notes
------- | ---------------
`1.0.0 beta` | Current version (work in progress)

<a id="license"></a>
## License

This project is released under the [MIT License](LICENSE).

<a id="credits"></a>
## Credits

* [Atom Electron](http://electron.atom.io)
* [Font Awesome](http://fontawesome.io)
* [Moment.js](http://momentjs.com)
