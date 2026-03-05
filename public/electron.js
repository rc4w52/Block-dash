const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 500,
    height: 750,
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.loadFile(path.join(__dirname, '../build/index.html'))
}

app.whenReady().then(createWindow)