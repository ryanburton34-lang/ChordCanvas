import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerPKG } from '@electron-forge/maker-pkg';
import { VitePlugin } from '@electron-forge/plugin-vite';

export default {
  packagerConfig: {
    icon: "./src/assets/icon",
    appBundleId: "com.ryanburton.chordcanvas-1",
    appCategoryType: "public.app-category.music",
    appVersion: "1.0",
    buildVersion: "1.0.0",
    asar: true,
    prune: true,
    osxPlatform: "mas",
darwinDarkModeSupport: true,
extendInfo: {
  LSMinimumSystemVersion: "12.0"
},
    ignore: [
      /^\/src$/,
      /^\/electron$/,
      /^\/scripts$/,
      /^\/node_modules\/\.*/,
      /^\/\._/,
      /\/\._/,
    ],
    osxSign: {
      identity: "Apple Distribution: PHILLIP RYAN BURTON (9R96Z4YYDV)",
      hardenedRuntime: false,
      entitlements: "electron/entitlements.mas.plist",
      entitlementsInherit: "electron/entitlements.mas.inherit.plist",
      provisioningProfile: "/Users/ryanburton/Downloads/Ryan_Burton.provisionprofile",
    },
  },

  makers: [
  new MakerZIP({}, ["darwin"]),
],

  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'electron/main.ts',
          config: 'electron/vite.main.config.ts',
          target: 'main'
        },
        {
          entry: 'electron/preload.ts',
          config: 'electron/vite.preload.config.ts',
          target: 'preload'
        }
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'electron/vite.renderer.config.ts'
        }
      ]
    })
  ]
};