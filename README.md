# Vuplicity

A cross-platform GUI for Duplicity backups, powered by Atom Electron.

[Features](#features) | [Installation](#installation) | [Todos & caveats](#todos) | [Changelog](#changelog) | [License](#license) | [Credits](#credits)
--- | --- | --- | --- | --- | ---

<a id="features"></a>
## Features

The GUI works directly with Duplicity by sending shell commands, so you can use your existing backups and / or create new ones independently.

### Status ([screen](/screenshots/status.full.png?raw=true))

![Status](/screenshots/status.thumb.png)

Check the status of a backup, start it manually, or restore its content.

### Configuration ([screen](/screenshots/settings.full.png?raw=true))

![Settings](/screenshots/settings.thumb.png)

Fill the source path, destination URL, passphrase, and custom CLI options if needed.

You can add several backup configurations on the left panel.

### File tree ([screen](/screenshots/filetree.full.png?raw=true))

![Filetree](/screenshots/filetree.thumb.png)

Check the content of the backup, or choose to restore a single file.

### Scheduler ([screen](/screenshots/schedules.full.png?raw=true))

![Schedules](/screenshots/schedules.thumb.png)

Schedule the backup by choosing a delay or a time, and the days when you want it to be applied (in the week or month).

You may also combine multiple schedules (for instance, one incremental backup each day at 2:00am, and one full backup once a month).

<a id="installation"></a>
## Installation

*Sorry, no prebuilt binaries for now, as `1.0.0` is still in active development...*

**1.** Install [Duplicity](http://duplicity.nongnu.org/) if needed

(Ensure it is included in your global `$PATH` to allow the app to access it)

**2.** Install [node.js](https://nodejs.org/) and [npm](https://github.com/npm/npm) if needed

**3.** Install [Atom Electron](http://electron.atom.io/) if needed (by using `npm`)

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

The following options are available, if needed:

| Option | Usage |
| :--- | :--- |
| `electron . --devtools` | Opens the devtools with the control panel |
| `electron . --configpath=/Users/johan/.vuplicity-dev` | Overrides the path of the config |

The GUI stores one JSON config file per backup in the following directory: `$HOME/.vuplicity`.

<a id="todos"></a>
## Todos & caveats

### App wrapper

Add a build task to wrap the app for each platform.

### Backup confirmation

* Add confirmation email - or notifications - with backup status
* Displays duplicity informations in the status tab (delta files, etc)

### Live progressbar

Display the progression of a backup by using the `--progress` Duplicity option.

*On my machine the progress does not show when using the cli tool, I'm a victim of the [ETA stalled bug](https://www.google.com/#q=duplicity+eta+stalled) - I will have to figure out why, before being able to develop this.*

### Update checker

Regularly check for updates and display a notice (on the control panel or the tray icon ?).

Allow the user to disable auto-check in the tray menu.

### Fix unsecure passphrases

Passphrases are stored in clear text in the configuration files.

It may be nice to encrypt the files with a global passphrase, and ask it to the user when starting the GUI.

### Backup informations

Add new backup informations, such as:

* ~~Next planned backup date on the left panel~~
* ~~Current backup size in the **Status** tab~~
* Informations on next planned backup (count of added & deleted files ?)

Make dates more readable (by using *from* and *to* notations ?)

### Interactive CLI

For now, there is no way to interact with the CLI tool.

For instance, when using the Dropbox backend, you have to load an authorization URL, and then tell the script to continue.

This step has to be executed manually; when it's done, you will be able to use the GUI.

<a id="changelog"></a>
## Changelog

| Version | Notes |
| --- | --- |
| `1.0.0 beta` | Current version (work in progress) |

<a id="license"></a>
## License

This project is released under the [MIT License](LICENSE).

<a id="credits"></a>
## Credits

* [Atom Electron](http://electron.atom.io)
* [Font Awesome](http://fontawesome.io)
* [Glob](https://github.com/isaacs/node-glob)
* [Later](https://github.com/bunkat/later)
* [yargs](https://github.com/bcoe/yargs)
* [electron-packager](https://github.com/maxogden/electron-packager)
* [moment](http://momentjs.com/)
