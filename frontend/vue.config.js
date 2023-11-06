const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      "appId": "com.janishutz.MusicPlayer",
      "copyright": "Copyright (c) 2023 MusicPlayer contributors",
      "buildVersion": "V2.0.0",
      builderOptions: {
        files: [
          "**/*",
          {
            from: "./*",
            to: "./*",
            filter: [ "**/*" ]
          }
        ],
        extraFiles: [
          {
            from: "./src/config",
            to: "./config",
            filter: [ "*.config.json" ]
          },
          {
            from: "./src/client",
            to: "./client",
            filter: [ "**/*" ]
          }
        ]
      }
    }
  }
})
