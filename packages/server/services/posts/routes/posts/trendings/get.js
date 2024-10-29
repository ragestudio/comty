import { Post } from "@db_models"
import { DateTime } from "luxon"

const maxDaysOld = 30

export default async (req) => {
    // fetch all posts that contain in message an #, with a maximun of 5 diferent hashtags
    let posts = await Post.find({
        message: {
            $regex: /#/gi
        },
        created_at: {
            $gte: DateTime.local().minus({ days: maxDaysOld }).toISO()
        }
    })
        .lean()

    // get the hastag content
    posts = posts.map((post) => {
        post.hashtags = post.message.match(/#[a-zA-Z0-9_]+/gi)

        post.hashtags = post.hashtags.map((hashtag) => {
            return hashtag.substring(1)
        })

        return post
    })

    // build trendings
    let trendings = posts.reduce((acc, post) => {
        post.hashtags.forEach((hashtag) => {
            if (acc.find((trending) => trending.hashtag === hashtag)) {
                acc = acc.map((trending) => {
                    if (trending.hashtag === hashtag) {
                        trending.count++
                    }

                    return trending
                })
            } else {
                acc.push({
                    hashtag,
                    count: 1
                })
            }
        })

        return acc
    }, [])

    // sort by count
    trendings = trendings.sort((a, b) => {
        return b.count - a.count
    })

    return trendings
}