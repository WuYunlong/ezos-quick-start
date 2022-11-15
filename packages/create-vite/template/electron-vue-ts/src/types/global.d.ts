import { ElectronAPI } from '../preload/electron-api/types'

export {}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}
