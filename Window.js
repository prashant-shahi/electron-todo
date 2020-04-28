'use strict'

const {BrowserWindow} = require('electron')

const defaultProps = {
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
        nodeIntegration: true
    }
}

class Window extends BrowserWindow {
    constructor ({ file, ...windowsSettings }) {
        super({ ...defaultProps, ...windowsSettings})

        this.loadFile(file)
        // this.webContents.openDevTools()

        this.once('ready-to-show', () => {
            this.show()
        })
    }
}

module.exports = Window
