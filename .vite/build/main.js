import { createRequire } from "node:module";
import { BrowserWindow, app, dialog, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
//#region electron/main.ts
var updateElectronAppModule = createRequire(import.meta.url)("update-electron-app");
var updateElectronApp = updateElectronAppModule.default ?? updateElectronAppModule.updateElectronApp ?? updateElectronAppModule;
if (typeof updateElectronApp === "function") updateElectronApp({
	repo: "ryanburton34-lang/ChordCanvas",
	updateInterval: "1 hour"
});
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
function createWindow() {
	new BrowserWindow({
		width: 1400,
		height: 900,
		minWidth: 1100,
		minHeight: 700,
		title: "ChordCanvas",
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: false,
			contextIsolation: true
		}
	}).loadURL("http://localhost:5173");
}
ipcMain.handle("export-pdf", async (_event, title) => {
	const win = BrowserWindow.getFocusedWindow();
	if (!win) return { ok: false };
	const safeTitle = (title || "ChordCanvas").replace(/[<>:"/\\|?*]+/g, "").trim() || "ChordCanvas";
	const { canceled, filePath } = await dialog.showSaveDialog(win, {
		title: "Export PDF",
		defaultPath: `${safeTitle}.pdf`,
		filters: [{
			name: "PDF",
			extensions: ["pdf"]
		}]
	});
	if (canceled || !filePath) return { ok: false };
	const pdfData = await win.webContents.printToPDF({
		printBackground: true,
		pageSize: "Letter",
		margins: { marginType: "none" }
	});
	await (await import("node:fs/promises")).writeFile(filePath, pdfData);
	return {
		ok: true,
		filePath
	};
});
app.whenReady().then(() => {
	createWindow();
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
//#endregion
