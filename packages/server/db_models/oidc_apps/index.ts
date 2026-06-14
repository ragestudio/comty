export type OidcApp = {
	client_id: string
	client_secret: string
	client_name: string
	owner_id: string
	redirect_uris: string[]
	grant_types: string[]
	response_types: string[]
	scopes: string[]
	logo_url?: string
	website_url?: string
}

export default {
	name: "OidcApp",
	collection: "oidc_apps",
	schema: {
		client_id: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		client_secret: {
			type: String,
			required: true,
			select: false,
		},
		client_name: {
			type: String,
			required: true,
		},
		owner_id: {
			type: String,
			required: true,
			index: true,
		},
		redirect_uris: {
			type: [String],
			required: true,
		},
		grant_types: {
			type: [String],
			required: true,
		},
		response_types: {
			type: [String],
			required: true,
		},
		scopes: {
			type: [String],
			required: true,
		},
		logo_url: {
			type: String,
		},
		website_url: {
			type: String,
		},
	},
}
