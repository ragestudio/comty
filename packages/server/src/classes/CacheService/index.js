import fs from "fs"
import path from "path"

export default class CacheService {
    watchingFiles = new Set()

    static deletionInterval = 1000 * 60 * 5

    appendToDeletion(filepath) {
        // create a interval of 5 minutes to delete the file
        // check the last time the file was accessed and if it was accessed in the last 5 minutes
        // reset the interval until the file is not accessed for 5 minutes and then delete it
        try {
            const createInterval = () => {
                return setInterval(() => {
                    const stats = fs.statSync(filepath)

                    stats.atime = new Date(stats.atime)

                    if (stats.atime.getTime() + CacheService.deletionInterval < Date.now()) {
                        clearInterval(this.watchingFiles.get(filepath).interval)

                        this.watchingFiles.delete(filepath)

                        fs.promises.unlink(filepath)
                    } else {
                        console.log(`[${filepath}] was accessed in the last 5 minutes, resetting deletion interval`)

                        clearInterval(this.watchingFiles.get(filepath).interval)

                        this.watchingFiles.get(filepath).interval = createInterval()
                    }
                })
            }

            this.watchingFiles.add({
                filepath,
                interval: createInterval()
            })
        } catch (error) {
            console.error(error)

            return fs.promises.unlink(filepath)
        }
    }
}