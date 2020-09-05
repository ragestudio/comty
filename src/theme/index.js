const { resolve } = require('path');
const lessToJs = require('less-vars-to-js');
const fs = require('fs');

const convToVars = file => lessToJs(fs.readFileSync(resolve(__dirname, file), 'utf8'))

module.exports = convToVars('./antd-theme.less')