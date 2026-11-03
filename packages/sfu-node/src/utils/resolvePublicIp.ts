import { networkInterfaces } from "os"
import { readFileSync } from "fs"
import { Resolver, resolveTxt } from "dns/promises"

const FALLBACK_DNS_SERVERS = ["216.239.32.10", "216.239.34.10"]

export function isPrivateIP(ip: string): boolean {
	const parts = ip.split(".").map(Number)

	if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
		return false
	}

	return (
		parts[0] === 0 || // this network (0.0.0.0/8)
		parts[0] === 10 || // Class A (10.0.0.0/8)
		parts[0] === 127 || // Loopback (127.0.0.0/8)
		(parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) || // CGNAT (100.64.0.0/10), includes tailscale
		(parts[0] === 169 && parts[1] === 254) || // Link-local (169.254.0.0/16)
		(parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // Class B (172.16.0.0/12)
		(parts[0] === 192 && parts[1] === 168) // Class C (192.168.0.0/16)
	)
}

// returns the interface used by the ipv4 default route, the one the system
// uses to reach the outside instead of a vpn or secondary interface
export function getDefaultRouteInterface(): string | null {
	try {
		const routes = readFileSync("/proc/net/route", "utf8")
			.trim()
			.split("\n")
			.slice(1)

		let selected: { name: string; metric: number } | null = null

		for (const line of routes) {
			const columns = line.trim().split(/\s+/)

			if (columns.length < 8) continue

			const [name, destination, , flags, , , metric] = columns

			// default route is 00000000 and has to be up
			if (destination !== "00000000") continue
			if (!(Number.parseInt(flags, 16) & 0x1)) continue

			const value = Number.parseInt(metric, 10) || 0

			if (!selected || value < selected.metric) {
				selected = { name, metric: value }
			}
		}

		return selected?.name ?? null
	} catch {
		return null
	}
}

function getInterfaceIPv4(name: string): string | null {
	for (const iface of networkInterfaces()[name] ?? []) {
		if (iface.family === "IPv4" && !iface.internal) {
			return iface.address
		}
	}

	return null
}

export function getLocalPublicIP(): string | null {
	const defaultInterface = getDefaultRouteInterface()

	if (defaultInterface) {
		const address = getInterfaceIPv4(defaultInterface)

		if (address && !isPrivateIP(address)) {
			return address
		}
	}

	// fallback for platforms without /proc/net/route, or when the default route
	// has a private address and another interface holds the public one
	for (const name of Object.keys(networkInterfaces())) {
		const address = getInterfaceIPv4(name)

		if (address && !isPrivateIP(address)) {
			return address
		}
	}

	return null
}

export async function getDnsPublicIP(): Promise<string> {
	try {
		const resolver = new Resolver()
		resolver.setServers(FALLBACK_DNS_SERVERS)

		let records: string[][]

		try {
			records = await resolver.resolveTxt("o-o.myaddr.l.google.com")
		} catch {
			// the fallback servers may be unreachable, use the system ones
			records = await resolveTxt("o-o.myaddr.l.google.com")
		}

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
