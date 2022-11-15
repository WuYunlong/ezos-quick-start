import { contextBridge, ipcRenderer } from 'electron'
import { ElectronAPI } from './types'

export const electronAPI: ElectronAPI = {
  ipcRenderer: {
    send(channel, ...args) {
      ipcRenderer.send(channel, ...args)
    },
    sendTo(webContentsId, channel, ...args) {
      ipcRenderer.sendTo(webContentsId, channel, ...args)
    },
    sendSync(channel, ...args) {
      ipcRenderer.sendSync(channel, ...args)
    },
    sendToHost(channel, ...args) {
      ipcRenderer.sendToHost(channel, ...args)
    },
    postMessage(channel, message, transfer) {
      if (!process.contextIsolated) {
        ipcRenderer.postMessage(channel, message, transfer)
      }
    },
    invoke(channel, ...args) {
      return ipcRenderer.invoke(channel, ...args)
    },
    on(channel, listener) {
      ipcRenderer.on(channel, listener)
      return this
    },
    once(channel, listener) {
      ipcRenderer.once(channel, listener)
      return this
    },
    removeListener(channel, listener) {
      ipcRenderer.removeListener(channel, listener)
      return this
    },
    removeAllListeners(channel) {
      ipcRenderer.removeAllListeners(channel)
      return this
    }
  }
}

export const exposeElectronAPI = () => {
  if (process.contextIsolated) {
    try {
      contextBridge.exposeInMainWorld('electron', electronAPI)
    } catch (error) {
      console.error(error)
    }
  } else {
    window.electron = electronAPI
  }
}
