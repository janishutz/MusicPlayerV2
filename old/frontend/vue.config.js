const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      "appId": "com.janishutz.MusicPlayerV2",
      "copyright": "Copyright (c) 2023 MusicPlayer contributors",
      "buildVersion": "V2.0.0-dev2",
      builderOptions: {
        files: [
          "**/*",
          {
            from: "./*",
            to: "./*",
            filter: [ "**/*" ]
          },
          {
            from: "./public/*",
            to: "./*",
            filter: [ "**/*" ]
          }
        ],
        extraFiles: [
          {
            from: "./src/client",
            to: "./client",
            filter: [ "**/*" ]
          },
          {
            from: "./src/config",
            to: "./config",
            filter: [ "*.config.json" ]
          }
        ]
      }
    }
  }
})
