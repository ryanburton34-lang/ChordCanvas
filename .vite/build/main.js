import { BrowserWindow as e, app as t, autoUpdater as n, dialog as r, ipcMain as i } from "electron";
import a from "node:path";
import { fileURLToPath as o } from "node:url";
//#region electron/main.ts
var s = o(import.meta.url), c = a.dirname(s);
function l() {
	if (!t.isPackaged) {
		console.log("Skipping updates in development mode.");
		return;
	}
	let e = `https://update.electronjs.org/ryanburton34-lang/ChordCanvas/${process.platform}-${process.arch}/${t.getVersion()}`;
	n.setFeedURL({ url: e }), n.on("error", (e) => {
		console.error("Auto-update error:", e);
	}), n.on("update-downloaded", () => {
		n.quitAndInstall();
	}), setTimeout(() => {
		n.checkForUpdates();
	}, 1e4), setInterval(() => {
		n.checkForUpdates();
	}, 3600 * 1e3);
}
function u() {
	new e({
		width: 1400,
		height: 900,
		minWidth: 1100,
		minHeight: 700,
		title: "ChordCanvas",
		webPreferences: {
			preload: a.join(c, "preload.js"),
			nodeIntegration: !1,
			contextIsolation: !0
		}
	}).loadFile(a.join(c, "../renderer/main_window/index.html"));
}
i.handle("export-pdf", async (t, n) => {
	let i = e.getFocusedWindow();
	if (!i) return { ok: !1 };
	let a = (n || "ChordCanvas").replace(/[<>:"/\\|?*]+/g, "").trim() || "ChordCanvas", { canceled: o, filePath: s } = await r.showSaveDialog(i, {
		title: "Export PDF",
		defaultPath: `${a}.pdf`,
		filters: [{
			name: "PDF",
			extensions: ["pdf"]
		}]
	});
	if (o || !s) return { ok: !1 };
	let c = await i.webContents.printToPDF({
		printBackground: !0,
		pageSize: "Letter",
		margins: { marginType: "none" }
	});
	return await (await import("node:fs/promises")).writeFile(s, c), {
		ok: !0,
		filePath: s
	};
}), t.whenReady().then(() => {
	l(), u(), t.on("activate", () => {
		e.getAllWindows().length === 0 && u();
	});
}), t.on("window-all-closed", () => {
	process.platform !== "darwin" && t.quit();
});
//#endregion
