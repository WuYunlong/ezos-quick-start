import { app, BrowserWindow } from 'electron'
import path from 'path'

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    show: false,

    autoHideMenuBar: true
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  } else {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] as string)
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
