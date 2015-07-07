# Vuplicity

![Icon](icon_tiny.png)

Downloads and features can be found on the [homepage](http://johansatge.com/vuplicity/).

---

* [Development installation](#development-installation)
* [Todos](#todos)
* [Changelog](#changelog)
* [License](#license)
* [Credits](#credits)

## Development installation

### Installation steps

**1.** Install [node.js](https://nodejs.org/) and [npm](https://github.com/npm/npm) if needed

**2.** Install [Atom Electron](http://electron.atom.io/) if needed (by using `npm`)

**3.** Install [Grunt](http://gruntjs.com/) if needed

**4.** Get the project and its dependencies

```bash
git clone https://github.com/johansatge/vuplicity.git
npm install
cd vuplicity/app && npm install
```

### Development

Run the application:

```bash
grunt run
```

The following options are available, if needed:

| Option | Usage |
| :--- | :--- |
| `grunt run --devtools` | Opens the devtools with the control panel |
| `grunt run --configpath=/Users/johan/.vuplicity-dev` | Overrides the path of the config |

Build the application for the desired platform:

```bash
grunt build --platforms=darwin,linux,win32
```

Watch for SASS updates:

```bash
grunt sass
```

## Todos

Planned features are listed in the [Issues](https://github.com/johansatge/vuplicity/issues).

## Changelog

| Version | Date | Notes |
| --- | --- | --- |
| `1.0.1` | July 2nd, 2015 | - Various CSS fixes<br>- Sanitizes history when doing a backup<br>- Fixes app icon on OSX |
| `1.0.0` | June 26th, 2015 | Initial version |

## License

This project is released under the [MIT License](LICENSE).

## Credits

* [Atom Electron](http://electron.atom.io)
* [Font Awesome](http://fontawesome.io)
* [Glob](https://github.com/isaacs/node-glob)
* [Later](https://github.com/bunkat/later)
* [yargs](https://github.com/bcoe/yargs)
* [electron-packager](https://github.com/maxogden/electron-packager)
* [moment](http://momentjs.com/)
