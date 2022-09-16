import { User, Post, Comment } from "../../../models"

export default (payload) => {
    const { parent_id, _id } = payload

    if (typeof _id !== "undefined") {
        return Comment.findById(_id)
    }

    return Comment.find({ parent_id })
}