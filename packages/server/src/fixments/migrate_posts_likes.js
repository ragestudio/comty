require("dotenv").config()

import fs from "fs"
import path from "path"

import { Post, PostLike } from "../models"
import { performance } from "perf_hooks"
import DBManager from "../classes/DbManager"

const logBuffer = []

function log(...args) {
    console.log(...args)

    logBuffer.push(`[${new Date().toISOString()}] | ${args.join(" ")}`)
}

process.on("unhandledRejection", (reason, promise) => {
    log("🆘 Unhandled Rejection at:", promise, "reason:", reason)

    writeLog()

    process.exit(1)
})

process.on("uncaughtException", (err) => {
    log("🆘 Uncaught Exception at:", err)

    writeLog()

    process.exit(1)
})

function writeLog() {
    fs.writeFileSync(path.resolve(process.cwd(), `migrate_posts_likes.${new Date().getTime()}.log`), logBuffer.join("\n"))
}

async function main() {
    const dbManager = new DBManager()
    await dbManager.connect()

    log(`Starting migration...`)

    const posts = await Post.find({}).catch(() => false)

    log(`✅ Found ${posts.length} posts`)

    for await (let post of posts) {
        let postData = post

        log(`➡️ Migrating post likes of [${post._id}]...`)

        const postMigrationStartTime = performance.now()

        if (postData["likes"]) {
            // create a PostLike for each like
            for await (let like of postData["likes"]) {
                try {
                    // check if the PostLike already exists
                    let likeObj = await PostLike.findOne({
                        post_id: post._id,
                        user_id: like,
                    }).catch(() => false)

                    if (likeObj) {
                        log(`🔗 PostLike for [${like}] already exists, skipping...`)
                        continue
                    }

                    log(`🔗 Creating PostLike for [${like}]...`)

                    likeObj = new PostLike({
                        post_id: post._id,
                        user_id: like,
                    })

                    await likeObj.save()

                    log(`🔗✅ Created PostLike for [${like}]`)
                } catch (error) {
                    log(`🔗❌ Error while creating PostLike for [${like}]:`, error)
                }
            }
        }

        const postMigrationEndTime = performance.now()

        log(`⏱️ Post likes migration of [${post._id}] took ${postMigrationEndTime - postMigrationStartTime}ms`)
    }

    log(`✅ Migrated ${posts.length} posts`)

    writeLog()
}

main()