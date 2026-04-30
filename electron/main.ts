import { createRequire } from "node:module";
import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const updateElectronAppModule = require("update-electron-app");
const updateElectronApp =
  updateElectronAppModule.default ?? updateElectronAppModule.updateElectronApp ?? updateElectronAppModule;

if (typeof updateElectronApp === "function") {
  updateElectronApp({
    repo: "ryanburton34-lang/ChordCanvas",
    updateInterval: "1 hour",
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "ChordCanvas",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    void win.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
}

ipcMain.handle("export-pdf", async (_event, title: string) => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return { ok: false };

  const safeTitle =
    (title || "ChordCanvas").replace(/[<>:"/\\|?*]+/g, "").trim() || "ChordCanvas";

  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: "Export PDF",
    defaultPath: `${safeTitle}.pdf`,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });

  if (canceled || !filePath) return { ok: false };

  const pdfData = await win.webContents.printToPDF({
    printBackground: true,
    pageSize: "Letter",
    margins: {
      marginType: "none",
    },
  });

  const fs = await import("node:fs/promises");
  await fs.writeFile(filePath, pdfData);

  return { ok: true, filePath };
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});