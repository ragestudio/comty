import fs from "fs"
import path from "path"

export default class CacheService {
    static deletionInterval = 1000 * 60 * 5

    static cachePath = path.join(process.cwd(), ".cache")

    constructor(params = {}) {
        this.params = params

        if (!fs.existsSync(CacheService.cachePath)) {
            fs.mkdirSync(CacheService.cachePath, { recursive: true })
        }
    }

    intervalMaps = new Map()

    checkDeletionFilepath(filepath) {
        try {
            const stats = fs.statSync(filepath)

            stats.atime = new Date(stats.atime)

            if (stats.atime.getTime() + CacheService.deletionInterval < Date.now()) {
                fs.promises.unlink(filepath)
            } else {
                return false
            }

            return true

        } catch (error) {
            console.error(error)

            fs.promises.unlink(filepath)

            return true
        }
    }

    appendToDeletion(filepath) {
        // create a interval of 5 minutes to delete the file
        // check the last time the file was accessed and if it was accessed in the last 5 minutes
        // reset the interval until the file is not accessed for 5 minutes and then delete it
        try {
            const createInterval = () => {
                let interval = setInterval(async () => {
                    try {
                        await this.checkDeletionFilepath(filepath)

                        this.intervalMaps.delete(filepath)

                        if (!results) {
                            this.appendToDeletion(filepath)
                        }
                    } catch (error) {
                        return clearInterval(interval)
                    }
                })

                return interval
            }

            this.intervalMaps.set(filepath, createInterval())
        } catch (error) {
            console.error(error)

            return fs.promises.unlink(filepath)
        }
    }
}