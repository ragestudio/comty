import fs from "node:fs"
import path from "node:path"

import Gateway from "./gateway"

const rootSSLDirPath = path.resolve(__dirname, "../../", ".ssl")
const cwdSSLDirPath = path.resolve(__dirname, ".ssl")

if (fs.existsSync(rootSSLDirPath) || fs.existsSync(cwdSSLDirPath)) {
	const rootKeyPath = path.resolve(rootSSLDirPath, "privkey.pem")
	const rootCertPath = path.resolve(rootSSLDirPath, "cert.pem")

	const cwdKeyPath = path.resolve(cwdSSLDirPath, "privkey.pem")
	const cwdCertPath = path.resolve(cwdSSLDirPath, "cert.pem")

	if (fs.existsSync(rootKeyPath) && fs.existsSync(rootCertPath)) {
		process.env.GATEWAY_SSL_KEY = rootKeyPath
		process.env.GATEWAY_SSL_CERT = rootCertPath
	} else if (fs.existsSync(cwdKeyPath) && fs.existsSync(cwdCertPath)) {
		process.env.GATEWAY_SSL_KEY = cwdKeyPath
		process.env.GATEWAY_SSL_CERT = cwdCertPath
	}
}

const inst = new Gateway({
	mode: process.env.GATEWAY_MODE ?? "ultra",
	auth: {
		serviceId: "users",
		url: "/users/self",
		method: "GET",
		data: (data) => {
			return {
				session: {
					user_id: data._id,
					username: data.username,
				},
				user: data,
			}
		},
	},
})

inst.initialize()
