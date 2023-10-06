 
const { app,  BrowserWindow,  Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let splashWindow;
let aboutWindow;
 
const baseUrl = "https://visualinteractor.azurewebsites.net/";




if (require('electron-squirrel-startup')) app.quit();


const conf = loadConfig();


let usr = "";
if(conf) {
  usr = conf.usr;
} else {
  app.quit();
}
 

function createSplashWindow() {
  splashWindow = new BrowserWindow({
   
    width: 487,
    height: 524,
    frame: false,
    transparent: true,
    center: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  splashWindow.loadURL(baseUrl+'splash.html');

  splashWindow.on('closed', () => {
    splashWindow = null;
  });

  setTimeout(() => {
    createMainWindow();
    splashWindow.close();
  }, 3000); // Adjust the duration of the splash screen as needed
}

function createMainWindow() {

  
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: '/images/icon.png',
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, './resources/config/preloadmain.js')
    },
  }); 

  
 
  

  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.setVisualZoomLevelLimits(1, 3); // Adjust the zoom limits as needed
  });


  
  mainWindow.loadURL(baseUrl+'getMain?usr='+usr);
  

  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });

  mainWindow.once('ready-to-show', () => {
   

    // Set the window title dynamically (replace 'Your Main Window Title' with your desired title)
    mainWindow.setTitle('Visual Interactor v1.0.0');
  });




  const mainMenuTemplate = [
    {
      label: 'Projects',
      submenu: [
        {
          label: 'Pevious',
          click: () => {
            mainWindow.webContents.goBack();
            mainWindow.once('ready-to-show', () => {
             
              mainWindow.setTitle('Visual Interactor v1.0.0');
            });
           
          },
        },
        {
          label: 'Load Project',
          click: () => {
           
            const inputDialog = new BrowserWindow({
              width: 550,
              height: 150,
              modal: true,
              parent: mainWindow,
              webPreferences: {
                nodeIntegration: true,
                preload: path.join(__dirname, './resources/config/preload.js')
              },
            });

            

            inputDialog.setMenu(null);

            
            inputDialog.loadURL(baseUrl+'getMenu?usr='+usr);
          },
        },
        {
          label: 'Reset User',
          click: () => {
            
            mainWindow.loadURL(baseUrl+'getMain?usr=');

          },
        },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
   
    {
      label: 'Zoom',
      submenu: [
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const zoomFactor = mainWindow.webContents.getZoomFactor();
            mainWindow.webContents.setZoomFactor(zoomFactor + 0.1);
          },
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const zoomFactor = mainWindow.webContents.getZoomFactor();
            mainWindow.webContents.setZoomFactor(zoomFactor - 0.1);
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Visual Interactor',
          click: () => {
            createAboutWindow();
          },
        },
      ],
    },
  ];

  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(mainMenu);
}

function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    width: 487,
    height: 524,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  aboutWindow.loadURL(baseUrl+'about.html');

  aboutWindow.setMenu(null);

  aboutWindow.on('closed', () => {
    aboutWindow = null;
  });
}

function loadConfig() {
  try {
    const configFile = fs.readFileSync('./resources/config/config.json', 'utf8');
    return JSON.parse(configFile);
  } catch (error) {
    console.error('Error loading configuration:', error);
    return null;
  }
}

app.on('ready', () => {
  createSplashWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

ipcMain.on('get-app-version', (event) => {
  event.returnValue = app.getVersion();
});

ipcMain.on('load-url', (event, url) => {
  const webContents = event.sender
  
  mainWindow.loadURL(url);
});


ipcMain.on('set-usr', (event, usr) => {
  storeUsrToFile({ usr: usr });
  mainWindow.loadURL(baseUrl+'getMain?usr='+usr);
});


ipcMain.on('set-title', (event, title) => {
  console.log("aqui tambien")
  const webContents = event.sender
  const win = BrowserWindow.fromWebContents(webContents)
  win.setTitle(title)
  mainWindow.setTitle(title)
});



// Function to read data from a file
function readDataFromFile(filePath, callback) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return callback(err, null);
    }
    try {
      const jsonData = JSON.parse(data);
      callback(null, jsonData);
    } catch (parseErr) {
      callback(parseErr, null);
    }
  });
}

// Function to write data to a file
function writeDataToFile(filePath, data, callback) {
  const jsonData = JSON.stringify(data);
  fs.writeFile(filePath, jsonData, (err) => {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
}

// Main function to store user data in a file
function storeUsrToFile(usr) {
  const filePath = path.join(__dirname, './resources/config/config.json');

  readDataFromFile(filePath, (readErr, existingData) => {
    if (readErr) {
      console.error('Error reading config.json:', readErr);
      return;
    }

    existingData.usr = usr;

    writeDataToFile(filePath, existingData, (writeErr) => {
      if (writeErr) {
        console.error('Error writing to config.json:', writeErr);
        return;
      }
      console.log('usr data has been updated in config.json');
    });
  });
}
