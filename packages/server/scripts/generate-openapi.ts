/**
 * Generates an openapi.json per service from the file-based routes tree,
 * without booting any server (no DB/redis needed).
 *
 * Usage:
 *   bun scripts/generate-openapi.ts [--coverage]
 *
 * Output:
 *   docs/openapi/<service>.json
 *
 * With --coverage it also diffs every service spec against the endpoint
 * URLs defined in modules/comty.js and prints the missing routes report.
 */

import fs from "node:fs"
import path from "node:path"

import loadSpecsFromRoutes from "@linebridge/plugin-openapi/src/loadSpecsFromRoutes"
import generateOpenAPIJson from "@linebridge/plugin-openapi/src/generateOpenAPIJson"

const serverRoot = path.resolve(import.meta.dirname, "..")
const repoRoot = path.resolve(serverRoot, "../..")
const servicesDir = path.join(serverRoot, "services")
const outDir = path.join(serverRoot, "docs", "openapi")
const clientEndpointsDir = path.join(
	repoRoot,
	"modules",
	"comty.js",
	"src",
	"endpoints",
)

const withCoverage = process.argv.includes("--coverage")

const methodFileRegex = /\/(get|post|put|delete|patch|options|head)\.(js|ts)$/i
const parametersRegex = /\[([a-zA-Z0-9_]+)\]/g

function* walk(dir: string): Generator<string> {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name)

		if (entry.isDirectory()) {
			yield* walk(full)
		} else {
			yield full
		}
	}
}

// same path derivation rules as linebridge's httpFileRoutes initializer
function routePathFromFile(routesDir: string, file: string) {
	const relative = path.relative(routesDir, file).split(path.sep).join("/")
	const parts = relative.split("/")

	const method = parts[parts.length - 1].split(".")[0].toLowerCase()

	let routePath = parts.slice(0, parts.length - 1).join("/")

	routePath = routePath.replace(parametersRegex, ":$1")
	routePath = routePath.replace("[$]", "*")
	routePath = routePath.replace(/\.(js|ts)$/, "")

	if (routePath.endsWith("/index")) {
		routePath = routePath.replace("/index", "")
	}

	return { method, path: `/${routePath}` }
}

async function buildServiceSpec(service: string) {
	const routesDir = path.join(servicesDir, service, "routes")

	if (!fs.existsSync(routesDir)) {
		return null
	}

	const endpoints: any[] = []

	for (const file of walk(routesDir)) {
		const normalized = file.split(path.sep).join("/")

		if (!methodFileRegex.test(normalized)) {
			continue
		}

		endpoints.push({
			...routePathFromFile(routesDir, file),
			_source_file: file,
		})
	}

	const spec: any = await generateOpenAPIJson(
		await loadSpecsFromRoutes(new Set(endpoints)),
	)

	spec.info = {
		title: `@comty/${service}`,
		version: process.env.npm_package_version ?? "0.0.0",
	}

	// tag every operation with the service name (used by doc generators
	// like docusaurus-plugin-openapi-docs to group paths)
	for (const methods of Object.values<any>(spec.paths)) {
		for (const operation of Object.values<any>(methods)) {
			operation.tags = [service]
		}
	}

	// list the service routes in the info page (info.description supports
	// markdown and is what doc generators render as the intro page)
	const routeRows: string[] = []

	for (const [routePath, methods] of Object.entries<any>(spec.paths)) {
		for (const [method, operation] of Object.entries<any>(methods)) {
			// kebab-case the operationId the same way doc generators slugify
			// page names (handles camelCase params like clientId -> client-id)
			const slug = String(operation.operationId)
				.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
				.replace(/([a-zA-Z])([0-9])/g, "$1-$2")
				.replace(/([0-9])([a-zA-Z])/g, "$1-$2")
				.replace(/_/g, "-")
				.toLowerCase()

			// mark operations that carry a response schema (from a .spec.ts
			// file or from static inference) so readers know what's documented
			const hasResponseSchema = Boolean(
				operation.responses?.["200"]?.content?.["application/json"]
					?.schema,
			)

			routeRows.push(
				`| \`${method.toUpperCase()}\` | [${routePath}](./${slug}) | ${hasResponseSchema ? "✅" : "—"} | ${operation.summary ?? ""} |`,
			)
		}
	}

	if (routeRows.length > 0) {
		spec.info.description = [
			`Endpoints exposed by the \`${service}\` service.`,
			"",
			"| Method | Path | Response | Description |",
			"| ------ | ---- | -------- | ----------- |",
			...routeRows.sort(),
		].join("\n")
	}

	return spec
}

// --- coverage diff against comty.js ---

function normalizePath(p: string) {
	return (
		p
			.replace(/\$\{[^}]+\}/g, "{}")
			.replace(/\{[a-zA-Z0-9_]*\}|\:[a-zA-Z0-9_]+/g, "{}")
			.replace(/\/$/, "") || "/"
	)
}

function loadClientUrls(): Set<string> {
	const urls = new Set<string>()

	if (!fs.existsSync(clientEndpointsDir)) {
		return urls
	}

	for (const file of walk(clientEndpointsDir)) {
		if (!file.endsWith(".ts")) continue

		const src = fs.readFileSync(file, "utf8")

		for (const match of src.matchAll(/url:\s*([^,\n]+)/g)) {
			for (const lit of match[1].matchAll(
				/`([^`]+)`|"([^"]+)"|'([^']+)'/g,
			)) {
				const value = lit[1] ?? lit[2] ?? lit[3]

				if (value?.startsWith("/")) {
					urls.add(normalizePath(value))
				}
			}
		}
	}

	return urls
}

// --- main ---

fs.mkdirSync(outDir, { recursive: true })

const services = fs
	.readdirSync(servicesDir, { withFileTypes: true })
	.filter((e) => e.isDirectory())
	.map((e) => e.name)
	.sort()

const clientUrls = withCoverage ? loadClientUrls() : new Set<string>()

let totalRoutes = 0
let totalMissing = 0

for (const service of services) {
	const spec = await buildServiceSpec(service)

	if (!spec) continue

	const outFile = path.join(outDir, `${service}.json`)

	fs.writeFileSync(outFile, JSON.stringify(spec, null, 2))

	const paths = Object.keys(spec.paths)
	totalRoutes += paths.length

	console.log(`[${service}] ${paths.length} rutas -> ${outFile}`)

	if (withCoverage) {
		const missing = paths.filter(
			(p) =>
				!clientUrls.has(normalizePath(p)) &&
				!["/", "/*", "/_map", "/openapi.json"].includes(p),
		)

		totalMissing += missing.length

		for (const p of missing) {
			const methods = Object.keys(spec.paths[p])
				.map((m) => m.toUpperCase())
				.join(",")

			console.log(`    falta en comty.js: ${methods} ${p}`)
		}
	}
}

console.log(
	`\n${totalRoutes} rutas en ${services.length} servicios` +
		(withCoverage
			? ` | ${totalMissing} sin endpoint en comty.js`
			: ""),
)
