 
const { app,  BrowserWindow,  Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let splashWindow;
let aboutWindow;


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

  splashWindow.loadURL('https://visualinteractor.azurewebsites.net/splash.html');

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

  
  //mainWindow.webContents.openDevTools();
  

  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.setVisualZoomLevelLimits(1, 3); // Adjust the zoom limits as needed
  });


  
  mainWindow.loadURL('https://visualinteractor.azurewebsites.net/getMain?usr='+usr);
  

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    //mainWindow.show();

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

            //inputDialog.webContents.openDevTools();

            inputDialog.setMenu(null);

            //inputDialog.loadFile('input_dialog.html');
            inputDialog.loadURL('https://visualinteractor.azurewebsites.net/getMenu?usr='+usr);
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

  aboutWindow.loadURL('https://visualinteractor.azurewebsites.net/about.html');

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
  const win = BrowserWindow.fromWebContents(webContents)
  mainWindow.loadURL(url);
});


ipcMain.on('set-usr', (event, usr) => {
  storeUsrToFile(usr);
  mainWindow.loadURL('https://visualinteractor.azurewebsites.net/getMain?usr='+usr);
});


ipcMain.on('set-title', (event, title) => {
  console.log("aqui tambien")
  const webContents = event.sender
  const win = BrowserWindow.fromWebContents(webContents)
  win.setTitle(title)
  mainWindow.setTitle(title)
});



function storeUsrToFile(usr) {
  // Define the file path where you want to store the data
  const filePath = path.join(__dirname, './resources/config/config.json');

  // Check if the file already exists
  if (fs.existsSync(filePath)) {
    // Read the existing content of the file
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading config.json:', err);
      } else {
        try {
          // Parse the existing JSON data
          const existingData = JSON.parse(data);

          // Update the existing data with the new 'usr' value
          existingData.usr = usr;

          // Convert the updated data to a JSON string
          const jsonData = JSON.stringify(existingData);

          // Write the updated JSON data back to the file
          fs.writeFile(filePath, jsonData, (writeErr) => {
            if (writeErr) {
              console.error('Error writing to config.json:', writeErr);
            } else {
              console.log('usr data has been updated in config.json');
            }
          });
        } catch (parseErr) {
          console.error('Error parsing existing config.json data:', parseErr);
        }
      }
    });
  } else {
    // If the file doesn't exist, create it with the 'usr' data
    const data = {
      usr: usr,
    };

    // Convert the data object to a JSON string
    const jsonData = JSON.stringify(data);

    // Write the JSON data to the file
    fs.writeFile(filePath, jsonData, (err) => {
      if (err) {
        console.error('Error writing to config.json:', err);
      } else {
        console.log('usr data has been stored in config.json');
      }
    });
  }
}

