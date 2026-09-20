import timelineMethod from "./methods/timeline.js"
import globalTimelineMethod from "./methods/globalTimeline.js"
import dataMethod from "./methods/data.js"
import getLikedMethod from "./methods/getLiked.js"
import getSavedMethod from "./methods/getSaved.js"
import fromUserIdMethod from "./methods/fromUserId.js"
import createMethod from "./methods/create.js"
import stageMethod from "./methods/stage.js"
import toggleSaveMethod from "./methods/toggleSave.js"
import toggleLikeMethod from "./methods/toggleLike.js"
import reportMethod from "./methods/report.js"
import flagMethod from "./methods/flag.js"
import deleteMethod from "./methods/delete.js"
import updateMethod from "./methods/update.js"
import repliesMethod from "./methods/replies.js"
import votePollMethod from "./methods/votePoll.js"
import deleteVotePollMethod from "./methods/deletePollVote.js"

export default class Posts {
	static timeline = timelineMethod
	static globalTimeline = globalTimelineMethod
	static data = dataMethod
	static getLiked = getLikedMethod
	static getSaved = getSavedMethod
	static fromUserId = fromUserIdMethod
	static create = createMethod
	static stage = stageMethod
	static toggleSave = toggleSaveMethod
	static toggleLike = toggleLikeMethod
	static report = reportMethod
	static flag = flagMethod
	static delete = deleteMethod
	static update = updateMethod
	static replies = repliesMethod
	static votePoll = votePollMethod
	static deleteVotePoll = deleteVotePollMethod
}
