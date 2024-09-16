const child_process = require("child_process")

async function buildAppDist(srcPath) {
    // build app for production
    console.log("⚒  Building app...")
    await child_process.execSync("yarn build", {
        cwd: srcPath,
        stdio: "inherit"
    })
    console.log("⚒  Building app done!")

    return srcPath
}

module.exports = buildAppDist