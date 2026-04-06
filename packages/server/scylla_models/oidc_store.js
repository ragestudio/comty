export default {
	key: ["id"],
	indexes: ["grantId", "uid"],
	table_name: "oidc_store",
	fields: {
		id: "text",
		type: "text",
		payload: "text",
		grantId: "text",
		uid: "text",
		consumedAt: "timestamp",
	},
}
