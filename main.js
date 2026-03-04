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
  win.loadURL('http://localhost:3000')
}

app.whenReady().then(createWindow)