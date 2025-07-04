import Post from "@db_models/post"

const StagedPostRef = {
	name: "StagedPostRef",
	description: "A reference to a staged post",
	type: "object",
	properties: {
		...Post.schema.obj,
		countLikes: {
			type: "number",
			description: "The number of likes the post has",
		},
		hasReplies: {
			type: "number",
			description: "The number of replies the post has",
		},
		share_url: {
			type: "string",
			description: "The share url of the post",
		},
		user: {
			type: "object",
			description: "The user who created the post",
		},
	},
}

export default {
	description: "Get all replies of a post",
	parameters: {
		post_id: {
			type: "string",
			description: "The id of the post",
		},
	},
	returns: {
		type: "array",
		description: "Replies post data",
	},
}
