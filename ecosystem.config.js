module.exports = {
    apps: [
        {
            name: "main_api",
            script: "./dist/index.js",
            instances: "max",
            exec_mode: "cluster",
            env: {
                "NODE_ENV": "production",
                "MAIN_LISTEN_PORT": 5000,
            },
            cwd: "./packages/server"
        },
        {
            name: "chat_api",
            script: "./dist/index.js",
            instances: "max",
            exec_mode: "cluster",
            env: {
                "NODE_ENV": "production",
                "HTTP_LISTEN_PORT": 5001,
            },
            cwd: "./packages/chat_server"
        },
        {
            name: "marketplace_api",
            script: "./dist/index.js",
            instances: "max",
            exec_mode: "cluster",
            env: {
                "NODE_ENV": "production",
                "HTTP_LISTEN_PORT": 5002,
            },
            cwd: "./packages/marketplace_server"
        },
        {
            name: "music_api",
            script: "./dist/index.js",
            instances: "max",
            exec_mode: "cluster",
            env: {
                "NODE_ENV": "production",
                "HTTP_LISTEN_PORT": 5003,
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
                "HTTP_LISTEN_PORT": 5004,
            },
            cwd: "./packages/file_server"
        },
    ],
}
