export default {
	key: ["client_id"],
	table_name: "oidc_apps",
	fields: {
		client_id: "text",
		client_secret: "text",
		owner_id: "uuid",
		client_name: "text",
		redirect_uris: {
			type: "list",
			typeDef: "<text>",
		},
		grant_types: {
			type: "list",
			typeDef: "<text>",
		},
		response_types: {
			type: "list",
			typeDef: "<text>",
		},
	},
}
