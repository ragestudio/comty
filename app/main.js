// Modules to control application life and create native browser window

const path = require('path');
const exec = require('child_process').exec;
const { app, BrowserWindow, ipcMain } = require('electron');

const isDev = process.env.NODE_ENV === 'development';

ipcMain.on('print', async (event, arg) => {
  // todo:下载网络文件到本地打印
  arg.pdf = `${__dirname}/ReferenceCard.pdf`;
  const fileUrl = arg.pdf;
  switch (process.platform) {
    case 'darwin':
    case 'linux':
      await exec('lp ' + fileUrl, (e) => {
        if (e) throw e;
      });
      event.reply('asynchronous-reply', 'print done!');
      break;
    case 'win32':
      await exec('print ' + fileUrl, {
        windowsHide: true,
      }, (e) => {
        if (e) throw e;
      });
      event.reply('asynchronous-reply', 'print done!');
      break;
    default:
      event.reply('asynchronous-reply', 'print failed!');
      throw new Error(
        'Platform not supported.',
      );
  }
});
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  for (const name of extensions) {
    try {
      await installer.default(installer[name], forceDownload);
    } catch (e) {
      console.log(`Error installing ${name} extension: ${e.message}`);
    }
  }
};

async function createWindow() {
  isDev && await installExtensions();

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (isDev) {
    mainWindow.loadURL('http://localhost:8000/');
    // Open the DevTools only if in development mode.
    mainWindow.webContents.openDevTools();
  } else {
    const rdurl = path.join(__dirname, '../dist/index.html') // path.join(__dirname, '../dist/index.html')
    console.log(rdurl)
    mainWindow.loadFile(rdurl)

  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// hot reload
isDev && require('electron-reload')(__dirname, {
  electron: require(`${__dirname}/../node_modules/electron`),
  ignored: /node_modules|[\/\\]\./,
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.