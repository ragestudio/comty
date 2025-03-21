export default class Posts {
	static timeline = require("./methods/timeline").default
	static globalTimeline = require("./methods/globalTimeline").default
	static data = require("./methods/data").default
	static getLiked = require("./methods/getLiked").default
	static getSaved = require("./methods/getSaved").default
	static fromUserId = require("./methods/fromUserId").default
	static create = require("./methods/create").default
	static stage = require("./methods/stage").default
	static toggleSave = require("./methods/toggleSave").default
	static toggleLike = require("./methods/toggleLike").default
	static report = require("./methods/report").default
	static flag = require("./methods/flag").default
	static delete = require("./methods/delete").default
	static update = require("./methods/update").default
	static replies = require("./methods/replies").default
	static votePoll = require("./methods/votePoll").default
	static deleteVotePoll = require("./methods/deletePollVote").default
}
