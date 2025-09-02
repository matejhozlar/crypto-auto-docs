const path = require("path");

module.exports = {
  packagerConfig: {
    asar: false,
    icon: path.resolve(__dirname, "assets", "icon.ico"),
    ignore: [
      /(^|[\\/])\.env$/i,
      /[\\/]scripts[\\/]\.env$/i,
      /[\\/]appdata[\\/]\.env$/i,
      /\.env\.[^\\/]+$/i,
    ],
    win32metadata: {
      CompanyName: "Matej Hozlar",
      FileDescription: "Crypto Auto Docs",
      ProductName: "Crypto Auto Docs",
    },
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "cryptoautodocs",
        setupIcon: path.resolve(__dirname, "assets", "icon.ico"),
      },
    },
    { name: "@electron-forge/maker-zip", platforms: ["win32"] },
  ],
};
