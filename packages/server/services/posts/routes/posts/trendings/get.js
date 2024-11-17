import { Post } from "@db_models"
import { DateTime } from "luxon"

const maxDaysOld = 30
const maxHashtags = 5

export default async (req) => {
    // fetch all posts that contain in message an #, with a maximun of 5 diferent hashtags
    const startDate = DateTime.local().minus({ days: maxDaysOld }).toISO()

    const trendings = await Post.aggregate([
        {
            $match: {
                message: { $regex: /#/gi },
                created_at: { $gte: startDate }
            }
        },
        {
            $project: {
                hashtags: {
                    $regexFindAll: {
                        input: "$message",
                        regex: /#[a-zA-Z0-9_]+/g
                    }
                }
            }
        },
        { $unwind: "$hashtags" },
        {
            $project: {
                hashtag: { $substr: ["$hashtags.match", 1, -1] }
            }
        },
        {
            $group: {
                _id: "$hashtag",
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: maxHashtags }
    ])

    return trendings.map(({ _id, count }) => ({ hashtag: _id, count }));
}