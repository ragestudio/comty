export default {
	name: "OidcApp",
	collection: "oidc_apps",
	schema: {
		client_id: { type: String, required: true, unique: true, index: true },
		client_secret: { type: String, required: true },
		client_name: { type: String, required: true },
		owner_id: { type: String, required: true, index: true },
		redirect_uris: [{ type: String }],
		grant_types: [{ type: String }],
		response_types: [{ type: String }],
		scopes: [{ type: String }],
		logo_url: { type: String },
		website_url: { type: String },
	},
}
