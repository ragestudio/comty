import Endpoint from "../../../../linebridge/server/src/classes/Endpoint"
import fs from "node:fs"

// OpenAPI Extension for Linebridge
// Registers and generates OpenAPI specification from registered routes/specifications

const typeMap = {
	string: { type: "string" },
	number: { type: "number" },
	boolean: { type: "boolean" },
	date: { type: "string", format: "date-time" },
	String: { type: "string" },
	Number: { type: "number" },
	Boolean: { type: "boolean" },
	Date: { type: "string", format: "date-time" },
}

function extractProperties(properties) {
	return Object.entries(properties).reduce((acc, [key, value]) => {
		let type = value.type?.name ? value.type.name.toLowerCase() : value.type
		if (type === "array" || type === Array) {
			acc[key] = { type: "array", items: { type: "string" } }
		} else {
			acc[key] = typeMap[type] || { type }
		}
		return acc
	}, {})
}

function extractRequiredKeys(properties) {
	return Object.keys(properties).filter((key) => properties[key].required)
}

function addSchemaRef(refs, ref) {
	// Basic validation and check if already added
	// Removed !ref.constructor check as it prevents Mongoose models (which are constructors)
	if (!ref || !ref.name || refs.has(ref.name)) {
		return // Return nothing as original didn't use return value
	}

	let schemaName
	let schemaType
	let rawProperties

	// Check if it's a Mongoose model (simple check for .schema property and .name)
	// Mongoose models typically have a 'schema' property and a 'name' property
	if (ref.schema && ref.name) {
		schemaName = ref.name
		schemaType = "object" // Mongoose models represent objects
		rawProperties = ref.schema.obj // Get the raw schema object structure
	} else {
		// Assume it's a standard specification ref object
		// It must have type and properties
		if (!ref.type || !ref.properties) {
			console.warn(
				`[OpenAPIPlugin] Invalid schema ref definition for ${ref.name}. Missing 'type' or 'properties'.`,
			)
			return
		}

		schemaName = ref.name
		schemaType = ref.type
		rawProperties = ref.properties
	}

	// Extract required keys and process properties for OpenAPI format
	const required = extractRequiredKeys(rawProperties)
	const properties = extractProperties(rawProperties)

	// Store the processed schema definition in the refs map
	refs.set(schemaName, { type: schemaType, required, properties })
}

function buildParameters(spec) {
	const params = []

	if (spec.parameters) {
		for (const [key, value] of Object.entries(spec.parameters)) {
			params.push({
				name: key,
				in: "path",
				required: true,
				description: value.description,
				schema: { type: value.type },
			})
		}
	}

	if (spec.query) {
		for (const [key, value] of Object.entries(spec.query)) {
			params.push({
				name: key,
				in: "query",
				required: value.required,
				description: value.description,
				schema: { type: value.type },
			})
		}
	}

	return params
}

function buildRequestBody(spec, refs) {
	if (!spec.body) {
		return undefined
	}

	let refName = null

	if (typeof spec.body.ref === "object") {
		addSchemaRef(refs, spec.body.ref)
		refName = spec.body.ref.name
	} else {
		refName = spec.body.ref.toString()
	}

	return {
		description: spec.body.description,
		content: {
			"application/json": {
				schema: {
					type: spec.body.type,
					$ref: `#/components/schemas/${refName}`,
				},
			},
		},
	}
}

function buildResponses(spec, refs) {
	const responses = {
		default: { description: "Default response" },
	}

	if (spec.returns) {
		let refName = null

		if (typeof spec.returns.ref === "object") {
			addSchemaRef(refs, spec.returns.ref)
			refName = spec.returns.ref.name
		} else {
			refName = spec.returns.ref.toString()
		}

		responses[200] = {
			description: spec.returns.description,
			content: {
				"application/json": {
					schema: {
						type: spec.returns.type,
						$ref: `#/components/schemas/${refName}`,
					},
				},
			},
		}
	}

	if (spec.errors) {
		for (const [code, err] of Object.entries(spec.errors)) {
			responses[code] = { description: err.description }
		}
	}

	return responses
}

async function generateOpenAPIJson(specifications) {
	const paths = {}
	const components = { schemas: {} }
	const refs = new Map()

	for (const spec of specifications) {
		const path = spec.path.replace(/:([^/]+)/g, `{$1}`)

		if (!paths[path]) {
			paths[path] = {}
		}

		const parameters = buildParameters(spec)
		const requestBody = buildRequestBody(spec, refs)
		const responses = buildResponses(spec, refs)

		paths[path][spec.method] = {
			description: spec.description,
			parameters,
			...(requestBody && { requestBody }),
			responses,
		}
	}

	for (const [name, ref] of refs) {
		components.schemas[name] = {
			type: ref.type,
			properties: ref.properties,
			...(ref.required && ref.required.length > 0
				? { required: ref.required }
				: {}),
		}
	}

	return {
		openapi: "3.0.0",
		info: {
			title: "api",
			version: "1.0.0",
		},
		paths,
		components,
	}
}

export default class OpenAPIPlugin {
	constructor(server) {
		this.server = server
	}

	specifications = new Set()

	async initialize() {
		for (const endpoint of this.server.engine.registers) {
			if (!endpoint.filePath) {
				continue
			}

			// Searc for spec file with same name as route file but with '.spec.js' extension
			const specFilePath = endpoint.filePath.replace(/\.js$/, ".spec.js")

			// Check if the spec file exists
			if (fs.existsSync(specFilePath)) {
				try {
					// Dynamically import the spec file
					const specModule = await import(specFilePath)

					// Get the specification export (assuming default or named 'specification')
					const specification =
						specModule.specification || specModule.default

					if (specification) {
						// Determine the actual spec details based on method
						const methodSpec =
							specification[endpoint.method.toLowerCase()] ??
							specification // Use lowercase method for key lookup

						// Construct the final spec object for the set
						const spec = {
							path: endpoint.route, // Assuming endpoint has route property
							method: endpoint.method, // Assuming endpoint has method property
							...methodSpec, // Include all details from the spec file (parameters, body, returns, errors, etc.)
						}

						this.specifications.add(spec)
					} else {
						console.warn(
							`[OpenAPIPlugin] Spec file found for ${endpoint.filePath} but no 'specification' or default export found.`,
						)
					}
				} catch (error) {
					console.error(
						`[OpenAPIPlugin] Failed to load spec file ${specFilePath}:`,
						error,
					)
				}
			}
		}

		const getOpenApiEndpoint = new Endpoint(async () => {
			return await generateOpenAPIJson(this.specifications)
		})

		this.server.register.http({
			method: "GET",
			route: "/openapi",
			fn: getOpenApiEndpoint.handler,
		})
	}
}
