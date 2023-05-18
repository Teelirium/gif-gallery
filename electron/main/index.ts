// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, "../..");
process.env.DIST = join(process.env.DIST_ELECTRON, "./dist");
process.env.PUBLIC = app.isPackaged
  ? process.env.DIST
  : join(process.env.DIST_ELECTRON, "./public");

import * as dotenv from "dotenv";
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  protocol,
  shell,
  Tray,
} from "electron";
import ElectronStore from "electron-store";
import positioner from "electron-traywindow-positioner";
import * as fs from "fs";
import { release } from "os";
import * as path from "path";
import { join } from "path";
import { z } from "zod";

dotenv.config();

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
const appIconPath = join(process.env.PUBLIC, "icon.png");
const dragIconPath = join(process.env.PUBLIC, "dnd.png");
const preload = join(__dirname, "../preload/index.js");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, "index.html");
const store = new ElectronStore();

async function createWindow() {
  win = new BrowserWindow({
    title: "GifGallery",
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    icon: appIconPath,
    webPreferences: {
      devTools: process.env.NODE_ENV === "development",
      preload,
      webSecurity: false,
      allowRunningInsecureContent: false,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (app.isPackaged) {
    win.loadFile(indexHtml);
  } else {
    win.loadURL(url);
    // win.webContents.openDevTools()
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });
}

function showWindow() {
  positioner.position(win, tray.getBounds());
  win.show();
}

function toggleWindow() {
  if (win.isVisible()) {
    return win.hide();
  }
  return showWindow();
}

async function createTray() {
  tray = new Tray(appIconPath);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        icon: nativeImage
          .createFromPath(appIconPath)
          .resize({ width: 20, height: 20 }),
        label: app.name,
        click: toggleWindow,
      },
      { type: "separator" },
      { role: "quit", label: `Quit ${app.name}` },
    ])
  );
  tray.on("click", () => {
    toggleWindow();
  });
}

app
  .whenReady()
  .then(() => {
    protocol.registerFileProtocol("gif", (request, callback) => {
      const newUrl = decodeURI(request.url.replace("gif://", ""));
      console.log(newUrl);
      callback(newUrl);
    });
  })
  .then(createWindow)
  .then(createTray);

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// new window example arg: new windows url
ipcMain.handle("open-win", (event, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
    },
  });

  if (app.isPackaged) {
    childWindow.loadFile(indexHtml, { hash: arg });
  } else {
    childWindow.loadURL(`${url}/#${arg}`);
    // childWindow.webContents.openDevTools({ mode: "undocked", activate: true })
  }
});

ipcMain.handle("start-drag", async (ev, fileName) => {
  ev.sender.startDrag({
    file: fileName,
    icon: dragIconPath,
  });
});

const foldersSchema = z.string().array().default([]);
ipcMain.handle("load-folders", async (ev) => {
  const folders = store.get("folders");
  return foldersSchema.parse(folders);
});

ipcMain.handle("save-folders", async (ev, folders: string[]) => {
  store.set("folders", folders);
});

ipcMain.handle("select-folder", async (ev) => {
  const folder = await dialog.showOpenDialog(win, {
    properties: ["openDirectory"],
  });
  return folder;
});

function readFolder(folder: string) {
  return new Promise<string[]>((resolve, reject) => {
    fs.promises
      .readdir(folder)
      .then((files) => {
        const fullPaths = files.map((file) => path.join(folder, file));
        resolve(fullPaths);
      })
      .catch(reject);
  });
}

ipcMain.handle("load-gifs", async (ev, folders: string[]) => {
  const promises = folders.map(readFolder);
  const allFiles = (await Promise.all(promises))
    .flat()
    .filter((file) => file.endsWith(".gif"));
  return allFiles;
});
