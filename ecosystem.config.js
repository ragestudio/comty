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
                "LOG_REQUESTS": true,
            },
            node_args: "-r dotenv/config",
            cwd: "./packages/server"
        },
        {
            name: "chat_api",
            script: "./dist/index.js",
            // instances: "max",
            // exec_mode: "cluster",
            env: {
                "NODE_ENV": "production",
                "HTTP_LISTEN_PORT": 5001,
            },
            node_args: "-r dotenv/config",
            cwd: "./packages/chat_server"
        },
        {
            name: "marketplace_api",
            script: "./dist/index.js",
            // instances: "max",
            // exec_mode: "cluster",
            env: {
                "NODE_ENV": "production",
                "HTTP_LISTEN_PORT": 5002,
            },
            node_args: "-r dotenv/config",
            cwd: "./packages/marketplace_server"
        },
        {
            name: "music_api",
            script: "./dist/index.js",
            // instances: "max",
            // exec_mode: "cluster",
            env: {
                "NODE_ENV": "production",
                "HTTP_LISTEN_PORT": 5003,
            },
            node_args: "-r dotenv/config",
            cwd: "./packages/music_server"
        },
        {
            name: "file_api",
            script: "./dist/index.js",
            // instances: "max",
            // exec_mode: "cluster",
            env: {
                "NODE_ENV": "production",
                "HTTP_LISTEN_PORT": 5004,
            },
            node_args: "-r dotenv/config",
            cwd: "./packages/file_server"
        },
        {
            name: "sync_api",
            script: "./dist/index.js",
            env: {
                "NODE_ENV": "production",
                "HTTP_LISTEN_PORT": 5005,
            },
            node_args: "-r dotenv/config",
            cwd: "./packages/sync_server"
        }
    ],
}
