import child_process from "node:child_process"

export default async function buildAppDist(srcPath) {
	// build app for production
	console.log("⚒  Building app...")
	await child_process.execSync("yarn build", {
		cwd: srcPath,
		stdio: "inherit",
	})
	console.log("⚒  Building app done!")

	return srcPath
}
