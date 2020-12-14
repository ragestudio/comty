const { readdirSync } = require('fs');
const { join } = require('path');
const process = require('process')

module.exports = function getPackages() {
  return readdirSync(join(process.cwd(), './packages')).filter(
    (pkg) => pkg.charAt(0) !== '.',
  );
};
