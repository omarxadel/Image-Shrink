const path = require('path')
const os = require('os')

const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron')

const imagemin = require('imagemin')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminPngquant = require('imagemin-pngquant')
const slash = require('slash')
const log = require('electron-log')


// ENVIRONMENT
process.env.NODE_ENV = 'production'

const isDev = process.env.NODE_ENV !== 'production' ? true : false
const isMac = process.platform === 'darwin' ? true : false

// WINDOWS
let mainWindow
let aboutWindow

function createMainWindow () {
    mainWindow = new BrowserWindow({
        title: 'ImageShrink',
        width: 500,
        height: 600,
        icon: `${__dirname}/assets/icons/Icon_256x256.png`,
        webPreferences:{
            nodeIntegration: true,
        }
    })

    mainWindow.loadURL(`file://${__dirname}/app/index.html`)
}

function createAboutWindow () {
    aboutWindow = new BrowserWindow({
        title: 'About ImageShrink',
        width: 300,
        height: 300,
        resizable: false,
        icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    })

    aboutWindow.loadURL(`file://${__dirname}/app/about.html`)
}

app.on('ready', () => {
    createMainWindow();

    const mainMenu = Menu.buildFromTemplate(menu)
    Menu.setApplicationMenu(mainMenu)

    mainWindow.on('closed', () => mainWindow = null)
})

// MENU
const menu = [
    ...(isMac ? [
        { 
            label: app.name,
            submenu:[
                {
                    label: 'About',
                    click: createAboutWindow,
                }
            ]
        }
    ] : []),
    {
        role: 'fileMenu'
    },
    ...(!isMac ? [
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: createAboutWindow,
                },
            ]
        }
    ] : []),
    ...(isDev? [
        {
        label: 'Developer',
        submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { type: 'separator' },
            { role: 'toggledevtools' }
        ]
        }
    ] : [] )
]

ipcMain.on('image:minimize', (e, options) => {
    options.dest = path.join(os.homedir(), 'imageshrink')
    shrinkImage(options)
})

async function shrinkImage({ imgPath, quality, dest }){
    try {
        const pngQuality = quality / 100
        const files = await imagemin([slash(imgPath)], {
            destination: dest,
            plugins: [
                imageminMozjpeg({ quality }),
                imageminPngquant({ 
                    quality: [pngQuality, pngQuality]
                 })
            ]
        })
        shell.openPath(dest)

        log.info(files)

        mainWindow.webContents.send('image:done')
    } catch (error) {
        log.error(error)
    }
}

app.on('window-all-closed', () => {
    if (!isMac) {
      app.quit()
    }
  })
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })

  