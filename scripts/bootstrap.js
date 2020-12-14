const { existsSync, writeFileSync, readdirSync } = require('fs');
const { join, resolve } = require('path');
const { getGit, getDevRuntimeEnvs } = require('@nodecorejs/dot-runtime')
const { yParser, execa } = require('@nodecorejs/libs');
const getPackages = require('./utils/getPackages');

(async () => {
  const devRuntime = getDevRuntimeEnvs();
  const args = yParser(process.argv);
  const version = require('./versionManager').version;

  const pkgs = getPackages();

  pkgs.forEach((packageName) => {
    const name = `@${devRuntime.headPackage}/${packageName}`;
    const pkgPath = resolve(__dirname, `../packages/${packageName}`)

    const pkgJSONPath = join(
      __dirname,
      '..',
      'packages',
      packageName,
      'package.json',
    );
    const pkgJSONExists = existsSync(pkgJSONPath);
    
    if (args.force || !pkgJSONExists) {
      const json = {
        name,
        version: version,
        main: 'dist/index.js',
        types: 'dist/index.d.ts',
        files: ['dist', 'src'],
        repository: {
          type: 'git',
          url: getGit(),
        },
        license: 'MIT',
        publishConfig: {
          access: 'public',
        },
      };
      if (pkgJSONExists) {
        const pkg = require(pkgJSONPath);
        [
          'dependencies',
          'devDependencies',
          'peerDependencies',
          'bin',
          'files',
          'authors',
          'types',
          'sideEffects',
          'main',
          'module',
        ].forEach((key) => {
          if (pkg[key]) json[key] = pkg[key];
        });
      }
      writeFileSync(pkgJSONPath, `${JSON.stringify(json, null, 2)}\n`);
    }

    if (packageName !== devRuntime.headPackage) {
      const readmePath = join(
        __dirname,
        '..',
        'packages',
        packageName,
        'README.md',
      );
      if (args.force || !existsSync(readmePath)) {
        writeFileSync(readmePath, `# ${name}\n`);
      }
    }

    try {
      const changeDirectoryArgs = [`${pkgPath}`]
      const installArgs = ['install']

      console.log(`📦 Installing modules [${packageName}]`)

      execa.sync('cd', changeDirectoryArgs)
      execa.sync('npm', installArgs)

    } catch (error) {
      function errorTable(err) {
        this.errno = err.errno
        this.code = err.code
        this.shortMessage = err.shortMessage
        
      }

      console.log(`❌ Cannot install node_modules from pkg '${packageName}'`)
      console.table([new errorTable(error)])
    }

  });
})()
.then(() => console.log("done"));
