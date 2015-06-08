# Vuplicity

A cross-platform GUI for Duplicity backups, powered by Atom Electron.

[Features](#features) | [Installation](#installation) | [Todos & caveats](#todos) | [Changelog](#changelog) | [License](#license) | [Credits](#credits)
--- | --- | --- | --- | --- | ---

<a id="features"></a>
## Features

The GUI works directly with Duplicity by sending shell commands, so you can use your existing backups and / or create new ones independently.

| Feature | Screenshot |
| --- | :---: |
| **Status**<br>Check the status of the backup and, start it manually, or restore its content | ![Status](/screenshots/status.thumb.png)<br>[Full view](/screenshots/status.full.png?raw=true) |
| **Configuration**<br>Fill the source path, destination URL, passphrase, and custom CLI options if needed<br>You can add several backup configurations on the left panel | ![Settings](/screenshots/settings.thumb.png)<br>[Full view](/screenshots/settings.full.png?raw=true) |
| **File tree**<br>Check the content of the backup, or choose to restore a single file | ![Filetree](/screenshots/filetree.thumb.png)<br>[Full view](/screenshots/filetree.full.png?raw=true) |
| **Scheduler**<br>Schedule the backup by choosing a delay or a time, and the days when you want it to be applied (in the week or month)<br>You may also combine multiple schedules (for instance, one incremental backup each day at 2:00am, and one full backup once a month) | ![Schedules](/screenshots/schedules.thumb.png)<br>[Full view](/screenshots/schedules.full.png?raw=true) |

The GUI stores one JSON config file per backup in the following directory: `$HOME/.vuplicity`.

<a id="installation"></a>
## Installation

*Sorry, no prebuilt binaries for now...*

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

<a id="todos"></a>
## Todos & caveats

### App wrapper

Add a build task to wrap the app for each platform.

### Schedules

Add confirmation email - or notifications - with backup status.

### Live progressbar

Display the progression of a backup by using the `--progress` Duplicity option.

*On my machine the progress does not show when using the cli tool, I'm a victim of the [ETA stalled bug](https://www.google.com/#q=duplicity+eta+stalled) - I will have to figure out why, before being able to develop this.*

### Fix unsecure passphrases

Passphrases are stored in clear text in the configuration files.

It may be nice to encrypt the files with a global passphrase, and ask the user when starting the GUI.

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
* [Moment.js](http://momentjs.com)
* [Glob](https://github.com/isaacs/node-glob)
* [Later](https://github.com/bunkat/later)
