---
sidebar_position: 2
---

# Installing Comty.JS

To get started with Comty.JS, you need to add it as a dependency to your project. The library is available on npm.

## Prerequisites

*   Node.js (version 12 or higher recommended, as per `jsonwebtoken` and `sucrase` dependencies)
*   A package manager like npm or Yarn

## Installation

You can install Comty.JS using either npm or Yarn:

### Using npm

```bash
npm install comty.js
```

### Using Yarn

```bash
yarn add comty.js
```

This will download Comty.JS and add it to your project's `node_modules` directory. The following dependencies will also be installed:

*   `@foxify/events`: ^2.1.0
*   `axios`: ^1.8.4
*   `js-cookie`: ^3.0.5
*   `jsonwebtoken`: ^9.0.0
*   `jwt-decode`: ^4.0.0
*   `linebridge-client`: ^1.1.1
*   `luxon`: ^3.6.0
*   `socket.io-client`: ^4.8.1

For development, if you plan to contribute or build the library locally, you'll also need:

*   `@ragestudio/hermes`: ^1.0.1 (used for building the project)

## Importing the library

Once installed, you can import Comty.JS into your project:

### ES Modules (JavaScript or TypeScript)

```javascript
import createClient from 'comty.js';
// or for specific models if needed (though typically client is the main entry)
// import { AuthModel, PostModel } from 'comty.js/models'; // Adjust path based on actual export structure if modular imports are supported
```

### CommonJS (Node.js)

```javascript
const createClient = require('comty.js');
// or for specific models
// const { AuthModel, PostModel } = require('comty.js/models'); // Adjust path
```

If you look at the `package.json`, the main entry point is `"./dist/index.js"`.

```json comty-project/public-repo/comty.js/package.json#L3
{
	"name": "comty.js",
	"version": "0.65.5",
	"main": "./dist/index.js",
	"description": "Official Comty API for JavaScript",
	"homepage": "https://github.com/ragestudio/comty.js",
	"author": "RageStudio <support@ragestudio.net>",
	"scripts": {
		"build": "hermes build"
	},
	"files": [
		"dist"
	],
	"license": "MIT",
	"dependencies": {
		"@foxify/events": "^2.1.0",
		"axios": "^1.8.4",
		"js-cookie": "^3.0.5",
		"jsonwebtoken": "^9.0.0",
		"jwt-decode": "^4.0.0",
		"linebridge-client": "^1.1.1",
		"luxon": "^3.6.0",
		"socket.io-client": "^4.8.1"
	},
	"devDependencies": {
		"@ragestudio/hermes": "^1.0.1"
	}
}

```

Now you're ready to initialize the client and start interacting with the Comty API.

## Next Steps

*   **[Client Initialization](./client-initialization.md)**: Learn how to set up and configure the Comty.JS client.