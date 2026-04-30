import { sign } from "@electron/osx-sign";

const appPath = "out/ChordCanvas-darwin-arm64/ChordCanvas.app";

console.log(`Signing ${appPath}...`);

try {
  await sign({
    app: appPath,
    identity: "Developer ID Application: PHILLIP RYAN BURTON (9R96Z4YYDV)",
    platform: "darwin",
    type: "distribution",
    hardenedRuntime: true,
    entitlements: "electron/entitlements.plist",
    entitlementsInherit: "electron/entitlements.plist",
    gatekeeperAssess: false,
  });

  console.log("Signed ChordCanvas successfully.");
} catch (error) {
  console.error("Signing failed:", error);
  process.exit(1);
}