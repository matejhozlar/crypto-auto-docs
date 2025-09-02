const path = require("path");

module.exports = {
  packagerConfig: {
    asar: false,
    icon: path.resolve(__dirname, "assets", "icon"),
    win32metadata: {
      CompanyName: "Matej Hozlar",
      FileDescription: "Crypto Auto Docs",
      ProductName: "Crypto Auto Docs",
    },
    ignore: [
      /(^|[\\/])\.env$/i,
      /[\\/]scripts[\\/]\.env$/i,
      /[\\/]appdata[\\/]\.env$/i,
      /\.env\.[^\\/]+$/i,
    ],
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "cryptoautodocs",
        setupIcon: path.resolve(__dirname, "assets", "icon.ico"),
      },
    },
    {
      name: "@electron-forge/maker-dmg",
      platforms: ["darwin"],
      config: {
        name: "Crypto Auto Docs",
        title: "Crypto Auto Docs",
        icon: path.resolve(__dirname, "assets", "icon.icns"),
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    { name: "@electron-forge/maker-zip", platforms: ["win32"] },
  ],
};
