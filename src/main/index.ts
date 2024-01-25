import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import {
  BrowserWindow,
  Menu,
  Tray,
  app,
  dialog,
  ipcMain,
  nativeImage,
  shell,
} from "electron";
import positioner from "electron-traywindow-positioner";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import dndIcon from "../../resources/dnd.png?asset";
import icon from "../../resources/icon.png?asset";

function toggleWindow(win: BrowserWindow, tray: Tray) {
  if (win.isVisible()) {
    return win.hide();
  }
  positioner.position(win, tray.getBounds());
  win.show();
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    title: "Gif Gallery",
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      devTools: true || process.env.NODE_ENV === "development",
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: false,
      contextIsolation: true,
    },
  });

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });
  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  return win;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app
  .whenReady()
  .then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId("com.teelirium.GifGallery");

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on("browser-window-created", (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    app.on("activate", function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  })
  .then(createWindow)
  .then((win) => {
    const tray = new Tray(icon);
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          icon: nativeImage
            .createFromPath(icon)
            .resize({ width: 20, height: 20 }),
          label: app.name,
          click: () => toggleWindow(win, tray),
        },
        { type: "separator" },
        { role: "quit", label: `Quit ${app.name}` },
      ]),
    );
    tray.on("click", () => {
      toggleWindow(win, tray);
    });

    // win.on("blur", () => {
    //   toggleWindow(win, tray);
    // });

    return win;
  })
  .then((win) => {
    ipcMain.handle("start-drag", async (ev, fileName: string) => {
      ev.sender.startDrag({
        file: fileName,
        icon: dndIcon,
      });
    });

    const foldersDefault: string[] = [];
    const foldersSchema = z.string().array().default(foldersDefault);
    const foldersPath = path.join(app.getPath("userData"), "folders.json");

    ipcMain.handle("load-folders", (ev) => {
      if (!fs.existsSync(foldersPath)) {
        fs.writeFileSync(foldersPath, JSON.stringify(foldersDefault));
      }
      const data = fs.readFileSync(foldersPath, "utf-8");
      return foldersSchema.parse(JSON.parse(data));
    });

    ipcMain.handle("save-folders", (ev, folders: string[]) => {
      fs.writeFileSync(
        foldersPath,
        JSON.stringify(foldersSchema.parse(folders)),
      );
    });

    ipcMain.handle("select-folder", async (ev) => {
      const folder = await dialog.showOpenDialog(win, {
        properties: ["openDirectory"],
      });
      return folder;
    });

    ipcMain.handle("load-gifs", async (ev, folders: string[]) => {
      const allFiles: string[] = [];
      for (const folder of folders) {
        const files = fs.readdirSync(folder);
        for (const file of files) {
          if (file.endsWith(".gif")) {
            allFiles.push(path.join(folder, file));
          }
        }
      }
      return allFiles;
    });

    // protocol.registerFileProtocol('gif', (request, callback) => {
    //   const newUrl = decodeURI(request.url.replace('gif://', ''));
    //   console.log(newUrl);
    //   callback(newUrl);
    // });
  });

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
