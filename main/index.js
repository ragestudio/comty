const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  dialog,
  shell,
  screen,
  globalShortcut
} = require('electron');
const path = require('path');
// const { spawn, exec } = require('child_process');
// const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const packagejson = require('../package.json')
const is = require('electron-is')
const waitOn = require('wait-on');

let app_path = is.dev()? 'http://127.0.0.1:8000/' : `file://${path.join(__dirname, '..', 'renderer')}/index.html`;
let mainWindow;
let tray;
let watcher;

// This gets rid of this: https://github.com/electron/electron/issues/13186
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;
// app.commandLine.appendSwitch("disable-web-security");
app.commandLine.appendSwitch('disable-gpu-vsync=gpu');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

const gotTheLock = app.requestSingleInstanceLock();

// Prevent multiple instances
if (!gotTheLock) {
  app.quit();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, './icon.png'),
    width: 1100,
    height: 700,
    minWidth: 1100,
    minHeight: 700,
    show: true,
    frame: false,
    transparent: true,
    backgroundColor: '#00ffffff',
    webPreferences: {
      experimentalFeatures: true,
      nodeIntegration: true,
      // Disable in dev since I think hot reload is messing with it
      webSecurity: !is.dev()
    }
  });

  if (is.dev()) {
    globalShortcut.register('CommandOrControl+R', () => {
      mainWindow.reload();
    });

    globalShortcut.register('F5', () => {
      mainWindow.reload();
    });
  }

  mainWindow.webContents.session.webRequest.onHeadersReceived(
    {
      urls: ['http://*/*', 'https://*/*']
    },
    (details, callback) => {
      // eslint-disable-next-line
      delete details.responseHeaders['Access-Control-Allow-Origin'];
      // eslint-disable-next-line
      delete details.responseHeaders['access-control-allow-origin'];
      if (details.url.includes('www.google-analytics.com')) {
        // eslint-disable-next-line
        details.responseHeaders['Access-Control-Allow-Origin'] = [
          'http://localhost:3000'
        ];
      } else {
        // eslint-disable-next-line
        details.responseHeaders['Access-Control-Allow-Origin'] = ['*'];
      }
      callback({
        cancel: false,
        responseHeaders: details.responseHeaders
      })
    }
  )

  tray = new Tray(
    is.dev()
      ? path.join(__dirname, './icon.png')
      : path.join(__dirname, '../build/icon.png')
  );

  const trayMenuTemplate = [
    {
      label: 'Dev Tools',
      click: () => mainWindow.webContents.openDevTools()
    },
    {
      label: 'Reload',
      click: () => ipcMain.invoke("appRestart")
    },
    {
      label: 'Close app',
      click: () => mainWindow.close()
    }
  ];

  const trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
  tray.setContextMenu(trayMenu);
  tray.setToolTip(packagejson.title);
  tray.on('double-click', () => mainWindow.show());

  mainWindow.loadURL(app_path);

  if (is.dev()) {
    mainWindow.webContents.openDevTools();
  }

  // const handleRedirect = (e, url) => {
  //   if (url !== mainWindow.webContents.getURL()) {
  //     e.preventDefault();
  //     shell.openExternal(url);
  //   }
  // };

  // mainWindow.webContents.on('will-navigate', handleRedirect);
  // mainWindow.webContents.on('new-window', handleRedirect);
}

app.on('ready', () => {
  if (is.dev()) {
    loadWindow = new BrowserWindow({ 
      width: 700, 
      height: 600,
      frame: false,
      resizable: false,
      center: true,
      transparent: true,
      backgroundColor: "#00000000",
    });
    loadWindow.loadURL(`file://${__dirname}/statics/loading_dev.html`)
    waitOn({ resources: [app_path] }, function (err) {
      if (err) {
        return log.log(err, ' | electron Aborted create window')
      }
      createWindow()
      loadWindow.close()
    });
  }else{
    createWindow()
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', async () => {
  mainWindow.removeAllListeners('close');
  mainWindow = null;
});

ipcMain.handle('update-progress-bar', (event, p) => {
  mainWindow.setProgressBar(p);
});

ipcMain.handle('hide-window', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.handle('show-window', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.handle('min-max-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else if (mainWindow.maximizable) {
    mainWindow.maximize();
  }
});

ipcMain.handle('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.handle('quit-app', () => {
  mainWindow.close();
});

ipcMain.handle('open-devtools', () => {
  mainWindow.webContents.openDevTools({ mode: 'undocked' });
});

ipcMain.handle('appRestart', () => {
  log.log('Restarting app');
  app.relaunch();
  mainWindow.close();
});
