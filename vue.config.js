module.exports = {
    configureWebpack: {
        devtool: 'source-map',
        externals: {
            fsevents: "require('fsevents')"
        }
    },
    pluginOptions: {
        electronBuilder: {
            externals: ['serialport', 'node-hid', 'escpos'],
            nodeIntegration: true,
            builderOptions: {
                mac: {
                    hardenedRuntime: true,
                    entitlements: "./build/entitlements.mac.inherit.plist"
                },
                linux: {
                  target: ["AppImage"]
                },
                publish: ['github'],
                appId: 'hid-devices.com',
                afterSign: './afterSignHook.js',
                // win: {
                //     target: "portable",
                // },
                // portable: {
                //     artifactName: "tria_polling_portable.exe"
                // }
            }
        }
    }
}