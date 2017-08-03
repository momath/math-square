const electron = require('electron')
const path = require('path')
const url = require('url')
const log = require('electron-log')

class App {
  constructor() {

    const argv = process.argv.slice(1);
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === '--dev' || argv[i] === '-dev' || argv[i] === '-d')
        this.dev = true;
    }

    electron.app.commandLine.appendSwitch('ignore-gpu-blacklist');

    if (this.dev) {
      log.transports.file.level = false;
      log.transports.console.level = 'debug';
    } else {
      log.transports.file.level = 'info';
      log.transports.console.level = false;
    }

    electron.app.on('ready', () => {
      this.create();
    });
    electron.app.on('window-all-closed', function () {
      electron.app.quit();
    });
    electron.app.on('activate', () => {
      this.create();
    });
  }

  create() {
    if (this.window)
      return;
    log.info('starting');

    const win = {
      title: "Math Square",
      width: 800,
      height: 1000,
      minWidth: 600,
      minHeight: 800,
      backgroundColor: '#000000',
      webPreferences: {
        nodeIntegration: true,
        webgl: true
      },
    };

    const menu = [
      { role: 'reload' },
      { role: 'forcereload' },
      { label: 'Restart',
        click () {
          electron.app.relaunch();
          electron.app.quit();
        }
      },
      { role: 'quit' }
    ];

    if (this.dev) {
      win.width = 1200;
    } else {
      if (false) {
        /* By default, positioned with top-left at lower-left of main display */
        const disp = electron.screen.getPrimaryDisplay();
        win.x = disp.bounds.x;
        win.y = disp.bounds.y + disp.bounds.height;
        /* Try to find a better display candidate to match */
        const disps = electron.screen.getAllDisplays();
        for (let d of disps) {
          if (d.bounds.x >= disp.bounds.x && d.bounds.x < disp.bounds.x + disp.bounds.width &&
              d.bounds.y > disp.bounds.y) {
            win.x = d.bounds.x;
            win.y = d.bounds.y;
            break;
          }
        }
      } else {
        /* Hard-coded correct coordinates for production: although above comes
         * up with the theoretically correct answer (0,768), for some reason
         * the real coordinates are (0,1040) */
        win.x = 0;
        win.y = 1040;
      }
      win.y -= win.height - 576;
      win.movable = false;
      win.resizable = false;
      win.minimizable = false;
      win.alwaysOnTop = true;
      win.frame = false;
      win.webPreferences.backgroundThrottling = false;

      menu.unshift({
        label: 'Debug Mode',
        click: () => {
          if (this.debug) {
            this.window.setResizable(false);
            this.window.setMovable(false);
            this.window.webContents.closeDevTools();
            this.debug = false;
          } else {
            this.window.setResizable(true);
            this.window.setMovable(true);
            this.window.webContents.openDevTools({mode:'detach'});
            this.debug = true;
          }
        }
      });
    }

    this.menu = electron.Menu.buildFromTemplate(menu);
    this.tray = new electron.Tray(path.join(__dirname, 'icon.png'));
    this.tray.setContextMenu(this.menu);

    this.window = new electron.BrowserWindow(win);

    if (this.dev)
      this.window.webContents.openDevTools({mode:'right'});

    this.window.on('closed', () => {
      log.info('closed');
      this.window = null;
    });

    this.window.on('unresponsive', () => {
      this.fatal('unresponsive');
    });

    this.window.webContents.on('did-finish-load', () => {
      log.info('loaded ' + this.window.webContents.getURL());
    });

    this.window.webContents.on('did-fail-load', () => {
      log.error('failed to load ' + this.window.webContents.getURL());
    });

    this.window.webContents.on('crashed', () => {
      this.fatal('crashed');
    });

    this.window.loadURL(url.format({
      pathname: path.join(__dirname, this.dev ? 'dev.html' : 'index.html'),
      protocol: 'file:',
      slashes: true
    }));

    if (!this.dev)
      /* Restart nightly at 5am (UTC) */
      setTimeout(() => {
        this.fatal('nightly restart');
      }, 86400000 - ((Date.now() + 68400000) % 86400000));

  }

  fatal(msg) {
    log.error('error: ' + msg);
    if (!this.dev) {
      electron.app.relaunch();
      electron.app.quit();
    }
  }
}

global.app = new App();
