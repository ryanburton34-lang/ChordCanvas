import { notarize } from "@electron/notarize";

const appPath = "out/ChordCanvas-darwin-arm64/ChordCanvas.app";

console.log(`Notarizing ${appPath}...`);

await notarize({
  appBundleId: "com.chordcanvas.app",
  appPath,
  appleId: process.env.APPLE_ID,
  appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
  teamId: process.env.APPLE_TEAM_ID,
});

console.log("Notarization complete.");