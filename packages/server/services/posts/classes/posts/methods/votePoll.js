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

    let vote = await VotePoll.findOne({
        user_id: payload.user_id,
        post_id: payload.post_id,
    })

    let previousOptionId = null

    if (vote) {
        previousOptionId = vote.option_id

        await VotePoll.deleteOne({
            _id: vote._id.toString()
        })
    }

    vote = new VotePoll({
        user_id: payload.user_id,
        post_id: payload.post_id,
        option_id: payload.option_id,
    })

    await vote.save()

    vote = vote.toObject()

    vote.previous_option_id = previousOptionId

    global.websocket.io.of("/").emit(`post.poll.vote`, vote)

    return vote
}