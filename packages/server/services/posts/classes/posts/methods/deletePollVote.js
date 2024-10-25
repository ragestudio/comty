import { VotePoll } from "@db_models"

export default async (payload = {}) => {
    if (!payload.user_id) {
        throw new OperationError(400, "Missing user_id")
    }

    if (!payload.post_id) {
        throw new OperationError(400, "Missing post_id")
    }

    if (!payload.option_id) {
        throw new OperationError(400, "Missing option_id")
    }

    let vote = await VotePoll.find({
        user_id: payload.user_id,
        post_id: payload.post_id,
        option_id: payload.option_id,
    })

    if (!vote) {
        throw new OperationError(404, "Poll vote not found")
    }

    await VotePoll.deleteOne({
        _id: vote._id
    })

    global.websocket.io.of("/").emit(`post.poll.vote.deleted`, vote)

    return vote
}