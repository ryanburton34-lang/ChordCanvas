import { contextBridge as e, ipcRenderer as t } from "electron";
//#region electron/preload.ts
e.exposeInMainWorld("chordCanvas", { exportPdf: (e) => t.invoke("export-pdf", e) });
//#endregion
