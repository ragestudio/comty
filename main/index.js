const { app, BrowserWindow, Menu, Tray, nativeImage } = require('electron')
const { join } = require('path')
const path = require('path')
const packagejson = require('../package.json')
const is = require('electron-is')
const waitOn = require('wait-on');

let app_path = `file://${join(__dirname, '..', 'renderer')}/index.html`;

if (is.dev()) {
  require('electron-debug')(); // eslint-disable-line global-require
}

if (is.dev()) {
  app_path = 'http://127.0.0.1:8000/';
}

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });

app.on('activate', () => {
  // inits
});

app.on('ready', () => {
  loadWindow = new BrowserWindow({ 
    icon: nativeImage.createFromPath(path.join(__dirname, '/public/favicon.png')), 
    width: 700, 
    height: 600,
    frame: false,
    resizable: false,
    center: true,
    transparent: true,
    
  });

  mainWindow = new BrowserWindow({
    icon: nativeImage.createFromPath(path.join(__dirname, '/public/favicon.png')), 
    show: false,
    width: 1280, 
    height: 720,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    } 
  });
 
  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, '/public/favicon.png')))

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open', type: 'normal', click:  function(){
      mainWindow.show();
  }  },
    { label: 'bruh', type: 'radio', checked: true },
  ])
  tray.setToolTip(packagejson.title)
  tray.setContextMenu(contextMenu)

  if (is.dev()) {
    loadWindow.loadURL(`file://${__dirname}/statics/loading_dev.html`)
  }else{
    loadWindow.loadURL(`file://${__dirname}/statics/loading.html`)
  }

  waitOn({ resources: [app_path] }, function (err) {
    if (err) {
      return console.log(err, ' | electron Aborted create window')
    }
    loadWindow.close()
    mainWindow.show()
    mainWindow.loadURL(app_path);
  });
  
});

app.on('close', (event) => {
  event.preventDefault();
  mainWindow.hide();
});

