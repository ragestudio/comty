import lbVars from "linebridge/dist/vars"

export default async function (req, res) {
	res.json({
		name: this.base.pkg.name,
		version: this.base.pkg.version,
		lb_version: lbVars.libPkg.version || "unknown",
		gateway: "ultra-gateway",
		uptime: process.uptime(),
		worker: process.worker,
	})
}
