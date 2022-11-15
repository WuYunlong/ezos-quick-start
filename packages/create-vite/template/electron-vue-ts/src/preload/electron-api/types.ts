export interface IpcRendererEvent extends Event {
  sender: IpcRenderer
  senderId: number
}

export type IpcListener = (event: IpcRendererEvent, ...args: any[]) => void

export interface IpcRenderer {
  on(channel: string, listener: IpcListener): this
  once(channel: string, listener: IpcListener): this
  removeAllListeners(channel: string): this
  removeListener(channel: string, listener: (...args: any[]) => void): this
  send(channel: string, ...args: any[]): void
  invoke(channel: string, ...args: any[]): Promise<any>
  postMessage(channel: string, message: any, transfer?: MessagePort[]): void
  sendSync(channel: string, ...args: any[]): any
  sendTo(webContentsId: number, ...args: any[]): void
  sendToHost(channel: string, ...args: any[]): void
}

export interface ElectronAPI {
  ipcRenderer: IpcRenderer
}
