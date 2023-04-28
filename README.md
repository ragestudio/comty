<img 
    src="https://storage.ragestudio.net/rstudio/branding/comty/comty_banner_transparent.svg" 
    width="100%" 
    alt="Comty logo"
/>

# Comty - A prototype of a social network
![CodeQL](https://github.com/srgooglo/comty/workflows/CodeQL/badge.svg?branch=master)
[![CodeFactor](https://www.codefactor.io/repository/github/ragestudio/comty/badge)](https://www.codefactor.io/repository/github/ragestudio/comty)
[![Maintainability](https://api.codeclimate.com/v1/badges/f89a278695d0a1301fe5/maintainability)](https://codeclimate.com/github/srgooglo/comty/maintainability)
[![Discord](https://img.shields.io/discord/769176303978938389?label=Discord)](https://discord.gg/yxQR6EXf2F)

A prototype of a platform inside of application focused on services and creatives.

## 🌟 Some of features
🚀 Real-time updates are provided to users about various activities such as new followers, likes, posts, comments, and more, thanks to a bid event engine that uses websockets.

📝 A microblogging system similar to Twitter allows users to post short messages with attachments and more.

🎥 Comty TV is a live video streaming feature that allows users to stream their videos, events, or anything else in real-time to other users. It provides playback anywhere, including HLS, RTMP, FLV, and WebRTC, without vendor lock-in.

🎶 Comty Music lets users publish their music masterpieces, share their playlists with other users, and synchronize their music with other platforms. A powerful music player is also included in the application.

🧩 Modular and Extensible architecture allows developers to create and publish extensions for the platform using the powerful API provided by Comty.

## 🚀 Development
### Prerequisites
For local development you will need to have installed some tools:

- Install Node.js (v13 or higher) [manualy](https://nodejs.org/en/download/) or use [nvm](https://github.com/nvm-sh/nvm) tool (Recommended)

- Install [Yarn](https://yarnpkg.com/getting-started/install) package manager (Recommended)

- Install [Docker](https://docs.docker.com/get-docker/), used for building and deployment

### Setup
- Getting the repository
```shell
git clone https://github.com/ragestudio/comty && cd comty
```

- Installing all dependencies
```shell
yarn
```

### Starting the development server
- You can use the command `yarn dev` to start all development servers with the `nodemon` package, which will restart the server when a file is changed.

## Status
😎 The project is in alpha design phase, and the development is slow but continuous, prioritizing quality to ensure the project base is preserved for a long time.

## 👥 The Comty team is looking for new members, and any contribution to the project is very welcome.
> If you are interested in more depth in the project, you can join our [Discord server](https://discord.gg/yxQR6EXf2F) and talk to us.

## Contributions 🤝
Contributions to Comty are welcome. If you want to contribute, please follow the instructions mentioned in the CONTRIBUTING.md file.

## License 📜
Comty is licensed under the LGPL-2.1 license. See the LICENSE file for more details.