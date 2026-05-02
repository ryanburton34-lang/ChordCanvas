import { sign } from "@electron/osx-sign";

const appPath = "out/ChordCanvas-mas-arm64/ChordCanvas.app";

console.log(`Signing MAS app: ${appPath}...`);

try {
  await sign({
    app: appPath,
    identity: "Apple Distribution: PHILLIP RYAN BURTON (9R96Z4YYDV)",
    platform: "mas",
    type: "distribution",
    hardenedRuntime: false,
    timestamp: false,
    entitlements: "electron/entitlements.mas.plist",
    entitlementsInherit: "electron/entitlements.mas.inherit.plist",
    provisioningProfile:
      "/Users/ryanburton/Documents/Chord Canvas/Certificates/Ryan_Burton.provisionprofile",
    gatekeeperAssess: false,
  });

  console.log("Signed MAS ChordCanvas successfully.");
} catch (error) {
  console.error("MAS signing failed:", error);
  process.exit(1);
}