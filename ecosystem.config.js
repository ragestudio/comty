module.exports = {
    apps: [
        {
            name: "main_api",
            script: "./dist/index.js",
            instances: "max",
            exec_mode: "cluster",
            env: {
                "NODE_ENV": "production",
            },
            cwd: "./packages/server"
        },
        {
            name: "music_api",
            script: "./dist/index.js",
            instances: "max",
            exec_mode: "cluster",
            env: {
                "NODE_ENV": "production",
            },
            cwd: "./packages/music_server"
        },
        {
            name: "file_api",
            script: "./dist/index.js",
            instances: "max",
            exec_mode: "cluster",
            env: {
                "NODE_ENV": "production",
            },
            cwd: "./packages/file_server"
        },
        {
            name: "marketplace_api",
            script: "./dist/index.js",
            instances: "max",
            exec_mode: "cluster",
            env: {
                "NODE_ENV": "production",
            },
            cwd: "./packages/marketplace_server"
        },
        {
            name: "chat_api",
            script: "./dist/index.js",
            instances: "max",
            exec_mode: "cluster",
            env: {
                "NODE_ENV": "production",
            },
            cwd: "./packages/chat_server"
        }
    ],
}
