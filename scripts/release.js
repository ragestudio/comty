const { yParser, execa, chalk } = require('@nodecorejs/libs');
const { getDevRuntimeEnvs } = require('@nodecorejs/dot-runtime');
const { join } = require('path');
const { writeFileSync } = require('fs');
const newGithubReleaseUrl = require('new-github-release-url');
const open = require('open');
const exec = require('./utils/exec');
const getPackages = require('./utils/getPackages');
const isNextVersion = require('./utils/isNextVersion');
const { getChangelog } = require('./utils/changelog');

const { bumpVersion, parsedVersionToString } = require('./updateVersion')

const cwd = process.cwd();
const args = yParser(process.argv.slice(2));
const lernaCli = require.resolve('lerna/cli');

function printErrorAndExit(message) {
  console.error(chalk.red(message));
  process.exit(1);
}

function logStep(name) {
  console.log(`${chalk.gray('>> Release:')} ${chalk.magenta.bold(name)}`);
}

async function release() {
  // Check git status
  if (!args.skipGitStatusCheck) {
    const gitStatus = execa.sync('git', ['status', '--porcelain']).stdout;
    if (gitStatus.length) {
      printErrorAndExit(`Your git status is not clean. Aborting.`);
    }
  } else {
    logStep(
      'git status check is skipped, since --skip-git-status-check is supplied',
    );
  }

  // get release notes
  logStep('get release notes');
  const releaseNotes = await getChangelog();
  console.log(releaseNotes(''));

  // Check npm registry
  logStep('check npm registry');
  const userRegistry = execa.sync(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['config', 'get', 'registry']).stdout;
  if (userRegistry.includes('https://registry.yarnpkg.com/')) {
    printErrorAndExit(
      `Release failed, please use ${chalk.blue('npm run release')}.`,
    );
  }
  if (!userRegistry.includes('https://registry.npmjs.org/')) {
    const registry = chalk.blue('https://registry.npmjs.org/');
    printErrorAndExit(`Release failed, npm registry must be ${registry}.`);
  }

  let updated = null;

  if (!args.publishOnly) {
    // Get updated packages
    logStep('check updated packages');
    const updatedStdout = execa.sync(lernaCli, ['changed']).stdout;
    updated = updatedStdout
      .split('\n')
      .map((pkg) => {
        if (pkg === 'nodecore') return pkg;
        else return pkg.split('/')[1];
      })
      .filter(Boolean);
    if (!updated.length) {
      printErrorAndExit('Release failed, no updated package is updated.');
    }

    // Clean
    logStep('clean');

    // Build
    if (!args.skipBuild) {
      logStep('build');
      await exec('npm', ['run', 'build']);
      require('./tsIngoreDefineConfig');
    } else {
      logStep('build is skipped, since args.skipBuild is supplied');
    }

    // Bump version
    bumpVersion(["minor"])

    const currVersion = require('../.version');

    // Sync version to root package.json
    logStep('sync version to root package.json');
    const rootPkg = require('../package');
    Object.keys(rootPkg.devDependencies).forEach((name) => {
      if (
        name.startsWith('@nodecorejs/') &&
        !name.startsWith('@nodecorejs/p')
      ) {
        rootPkg.devDependencies[name] = currVersion;
      }
    });
    writeFileSync(
      join(__dirname, '..', 'package.json'),
      JSON.stringify(rootPkg, null, 2) + '\n',
      'utf-8',
    );

    // Commit
    const commitMessage = `release: v${currVersion}`;
    logStep(`git commit with ${chalk.blue(commitMessage)}`);
    await exec('git', ['commit', '--all', '--message', commitMessage]);

    // Git Tag
    logStep(`git tag v${currVersion}`);
    await exec('git', ['tag', `v${currVersion}`]);

    // Push
    logStep(`git push`);
    await exec('git', ['push', 'origin', 'master', '--tags']);
  }

  // Publish
  // Umi must be the latest.
  const runtimeEnvs = getDevRuntimeEnvs()
  if (!runtimeEnvs.headPackage) {
    return printErrorAndExit(`headPackage is missing on runtime`);
  }

  const pkgs = args.publishOnly ? getPackages() : updated;
  logStep(`publish packages: ${chalk.blue(pkgs.join(', '))}`);
  const currVersion = require('../lerna').version;
  const isNext = isNextVersion(currVersion);
  pkgs.sort((a) => {
      return a === runtimeEnvs.headPackage ? 1 : -1;
    })
    .forEach((pkg, index) => {
      const pkgPath = join(cwd, 'packages', pkg);
      const { name, version } = require(join(pkgPath, 'package.json'));
      if (version === currVersion) {
        console.log(
          `[${index + 1}/${pkgs.length}] Publish package ${name} ${isNext ? 'with next tag' : ''
          }`,
        );
        const cliArgs = isNext ? ['publish', '--tag', 'next'] : ['publish'];
        try {
          const { stdout } = execa.sync('npm', cliArgs, {
            cwd: pkgPath,
          })
          console.log(stdout);
        } catch (error) {
          console.log(`❌ Failed to publish > ${pkg} >`, err)
        }
      }
    });


  if (!runtimeEnvs.originGit) {
    return printErrorAndExit(`originGit is missing on runtime`);
  }

  logStep('create github release');
  const tag = `v${currVersion}`;
  const changelog = releaseNotes(tag);
  console.log(changelog);
  const url = newGithubReleaseUrl({
    repoUrl: runtimeEnvs.originGit,
    tag,
    body: changelog,
    isPrerelease: isNext,
  });
  try {
    await open(url);
  } catch (error) {
    console.log("Try opening url >", url)
  }

  logStep('done');
}

release().catch((err) => {
  console.error(err);
  process.exit(1);
});
