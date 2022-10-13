import { Post } from "../models"
import DBManager from "../classes/DbManager"

async function main() {
    const dbManager = new DBManager()
    await dbManager.connect()

    const posts = await Post.find({}).catch(() => false)

    for await (let post of posts) {
        let postData = post.toObject()

        if (postData["additions"]) {
            // transform additions to attachments
            postData["attachments"] = postData["additions"]
        }

        post.attachments = postData["attachments"]

        await post.save()
    }

    console.log("Done!")
}

main()