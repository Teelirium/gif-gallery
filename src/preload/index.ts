import { electronAPI } from '@electron-toolkit/preload';
import { contextBridge, ipcRenderer } from 'electron';

const api = {
  get isWindows() {
    return process.platform === 'win32';
  },
  startDrag(fileName: string) {
    return ipcRenderer.invoke('start-drag', fileName) as Promise<void>;
  },
  loadFolders() {
    return ipcRenderer.invoke('load-folders') as Promise<string[]>;
  },
  saveFolders(folders: string[]) {
    return ipcRenderer.invoke('save-folders', folders) as Promise<void>;
  },
  selectFolder() {
    return ipcRenderer.invoke('select-folder') as Promise<Electron.OpenDialogReturnValue>;
  },
  loadGifs(folders: string[]) {
    return ipcRenderer.invoke('load-gifs', folders) as Promise<string[]>;
  },
};

export type Api = typeof api;

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
