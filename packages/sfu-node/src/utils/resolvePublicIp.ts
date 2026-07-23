import { networkInterfaces } from "os"
import { resolveTxt, setServers } from "dns/promises"

export function isPrivateIP(ip: string): boolean {
	const parts = ip.split(".").map(Number)

	return (
		parts[0] === 10 || // Class A (10.0.0.0/8)
		(parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // Class B (172.16.0.0/12)
		(parts[0] === 192 && parts[1] === 168) || // Class C (192.168.0.0/16)
		parts[0] === 127 || // Loopback (127.0.0.0/8)
		(parts[0] === 169 && parts[1] === 254) // Link-local (169.254.0.0/16)
	)
}

export function getLocalPublicIP(): string | null {
	const interfaces = networkInterfaces()

	for (const name of Object.keys(interfaces)) {
		for (const iface of interfaces[name] || []) {
			if (iface.family === "IPv4" && !iface.internal) {
				if (!isPrivateIP(iface.address)) {
					return iface.address
				}
			}
		}
	}
	return null
}

export async function getDnsPublicIP(): Promise<string> {
	try {
		setServers(["216.239.32.10", "216.239.34.10"])
		const records = await resolveTxt("o-o.myaddr.l.google.com")

		const ip = records[0][0].replace(/"/g, "")
		return ip
	} catch (error) {
		throw new Error(
			"Failed to resolve public IP via DNS: " + (error as Error).message,
		)
	}
}

export async function resolvePublicIP(): Promise<string> {
	const localIp = getLocalPublicIP()

	if (localIp) {
		return localIp
	}

	return await getDnsPublicIP()
}

export default resolvePublicIP
