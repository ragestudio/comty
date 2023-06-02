module.exports = {
    apps: [
        {
            name: "main_api",
            script: "./packages/server/dist/index.js",
            instances: "max",
            exec_mode: "cluster"
        },
        {
            name: "music_api",
            script: "./packages/music_server/dist/index.js",
            instances: "max",
            exec_mode: "cluster"
        },
        {
            name: "file_api",
            script: "./packages/file_server/dist/index.js",
            instances: "max",
            exec_mode: "cluster"
        },
        {
            name: "marketplace_api",
            script: "./packages/marketplace_server/dist/index.js",
            instances: "max",
            exec_mode: "cluster"
        },
        {
            name: "chat_api",
            script: "./packages/chat_server/dist/index.js",
            instances: "max",
            exec_mode: "cluster"
        }
    ],
}
