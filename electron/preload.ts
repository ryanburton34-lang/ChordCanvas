export {};import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("chordCanvas", {
  exportPdf: (title: string) => ipcRenderer.invoke("export-pdf", title),
});