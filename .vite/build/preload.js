import { contextBridge, ipcRenderer } from "electron";
//#region electron/preload.ts
contextBridge.exposeInMainWorld("chordCanvas", { exportPdf: (title) => ipcRenderer.invoke("export-pdf", title) });
//#endregion
