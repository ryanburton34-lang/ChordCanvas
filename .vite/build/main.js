import { BrowserWindow, app, autoUpdater, dialog, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
//#region electron/main.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
function setupAutoUpdates() {
	if (!app.isPackaged) {
		console.log("Skipping updates in development mode.");
		return;
	}
	const feedUrl = `https://update.electronjs.org/ryanburton34-lang/ChordCanvas/${process.platform}-${process.arch}/${app.getVersion()}`;
	autoUpdater.setFeedURL({ url: feedUrl });
	autoUpdater.on("error", (error) => {
		console.error("Auto-update error:", error);
	});
	autoUpdater.on("update-downloaded", () => {
		autoUpdater.quitAndInstall();
	});
	setTimeout(() => {
		autoUpdater.checkForUpdates();
	}, 1e4);
	setInterval(() => {
		autoUpdater.checkForUpdates();
	}, 3600 * 1e3);
}
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
	if (!process.mas) setupAutoUpdates();
	createWindow();
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
//#endregion
