const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  MenuItem,
  dialog,
  shell,
  screen,
  BrowserView,
  systemPreferences, 
  Notification,
  globalShortcut
} = require('electron')
const path = require('path')
// const { spawn, exec } = require('child_process')
// const { autoUpdater } = require('electron-updater')
const log = require('electron-log');
const packagejson = require('../package.json')
const is = require('electron-is')
const waitOn = require('wait-on');
const { getDoNotDisturb } = require('electron-notification-state');
const RuntimeConfig = require("../config");

let app_path = is.dev()? "localhost:8000" : `file://${path.join(__dirname, '..', 'renderer')}/index.html`;
let mainWindow;
let tray;
let watcher;

// This gets rid of this: https://github.com/electron/electron/issues/13186
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true
// app.commandLine.appendSwitch("disable-web-security")
//app.commandLine.appendSwitch('disable-gpu-vsync=gpu')
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')

const gotTheLock = app.requestSingleInstanceLock()
const notifySupport = Notification.isSupported()
const isNotDisturb = getDoNotDisturb()

// Prevent multiple instances
if (!gotTheLock) {
  app.quit()
}

function relaunchApp(){
  mainWindow.close()
  app.relaunch()
}

function resumeApp(){
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
  }else{
    createWindow()
  }
}

function notify(params) {
  if(!notifySupport || !params) return false
  let options = {
    title: "",
    body: "",
    icon: null,
    timeoutType: "default"
  }

  const keys = Object.keys(params)
  const values = Object.values(params)

  for (let i = 0; i < keys.length; i++) {
    options[keys[i]] = values[i]
  }

  new Notification(options).show()
}

async function __init() {
  createWindow()
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: packagejson.title,
    icon: path.join(__dirname, './icon.png'),
    width: 1100,
    height: 700,
    minWidth: 1256,
    minHeight: 755,
    show: true,
    frame: false,
    transparent: false,
    hasShadow: true,
    //webgl: true,
    visualEffectState: "followWindow",
    backgroundColor: '#00ffffff',
    webPreferences: {
      //enableRemoteModule: true,
      enableBlinkFeatures: true,
      experimentalFeatures: true,
      nodeIntegration: true,
      // Disable in dev since I think hot reload is messing with it
      webSecurity: !is.dev()
    }
  })

  if (is.dev()) {
    app.commandLine.appendSwitch('remote-debugging-port', '9222')
    globalShortcut.register('CommandOrControl+R', () => {
      mainWindow.reload()
    })

    globalShortcut.register('F5', () => {
      mainWindow.reload()
    })
  }

  mainWindow.webContents.session.webRequest.onHeadersReceived(
    {
      urls: ['http://*/*', 'https://*/*']
    },
    (details, callback) => {
      delete details.responseHeaders['Access-Control-Allow-Origin']
      delete details.responseHeaders['access-control-allow-origin']
      if (details.url.includes('www.google-analytics.com')) {
        details.responseHeaders['Access-Control-Allow-Origin'] = [ app_path ]
      } else {
        details.responseHeaders['Access-Control-Allow-Origin'] = ['*']
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
      label: '🧰 Open DevTools',
      click: () => mainWindow.webContents.openDevTools()
    },
    {
      label: '🔄 Relaunch',
      click: () => {
        relaunchApp()
      }
    },
    {
      label: '🛑 Quit',
      click: () => app.quit()
    }
  ];

  tray.setContextMenu(Menu.buildFromTemplate(trayMenuTemplate))
  tray.setToolTip(RuntimeConfig.siteName)
  tray.on('double-click', () => resumeApp())

  mainWindow.loadURL(app_path)
  mainWindow.focus()

  if (is.dev()) {
    mainWindow.webContents.openDevTools()
  }

  // const handleRedirect = (e, url) => {
  //   if (url !== mainWindow.webContents.getURL()) {
  //     e.preventDefault()
  //     shell.openExternal(url)
  //   }
  // };

  // mainWindow.webContents.on('will-navigate', handleRedirect)
  // mainWindow.webContents.on('new-window', handleRedirect)
}

app.on('ready', () => {
  if (is.dev()) {
    loadWindow = new BrowserWindow({ 
      width: 700, 
      height: 500,
      frame: false,
      resizable: false,
      center: true,
      transparent: true,
      backgroundColor: "#00000000",
    });
    loadWindow.loadURL(`file://${__dirname}/statics/loading_dev.html`)
    notify({title: "Starting development server..."})
    waitOn({ resources: [app_path] }, function (err) {
      if (err) {
        return log.log(err)
      }
      __init()
      loadWindow.close()
    })
  }else{
    __init()
  }
})

app.on('window-all-closed', () => {
  mainWindow = null;
})

app.on('before-quit', async () => {
  mainWindow.removeAllListeners('close');
  mainWindow = null;
})

ipcMain.handle('update-progress-bar', (event, p) => {
  mainWindow.setProgressBar(p);
})

ipcMain.handle('hide-window', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
})

ipcMain.handle('show-window', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
})

ipcMain.handle('min-max-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else if (mainWindow.maximizable) {
    mainWindow.maximize();
  }
})

ipcMain.handle('getSystemPreferences', () => {
  return systemPreferences
})

ipcMain.handle('minimize-window', () => {
  mainWindow.minimize();
})

ipcMain.handle('quit-app', () => {
  app.quit();
})

ipcMain.handle('open-devtools', () => {
  mainWindow.webContents.openDevTools({ mode: 'undocked' });
})

ipcMain.handle('appRelaunch', () => {
  relaunchApp()
})

ipcMain.handle('app_notify', (event, payload) => {
  notify(payload)
})

ipcMain.handle('contextualMenu', (event, payload) => {
  contextualMenu(payload)
})

ipcMain.handle('inspectElement', (event, payload) => {
  mainWindow.inspectElement(payload.x, payload.y)
})