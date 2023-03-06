const os = require("os")

function getUsage() {
    let usage = process.cpuUsage()

    usage.time = process.uptime() * 1000
    usage.percent = (usage.system + usage.user) / (usage.time * 10)

    return usage
}

export default {
    method: "GET",
    route: "/server/health",
    fn: async (req, res) => {
        const cpus = os.cpus()

        // get process info, memory usage, etc
        const processInfo = {
            memoryUsage: process.memoryUsage(),
            cpuUsage: getUsage(),
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            cpus: cpus,
        }

        return res.json(processInfo)
    }
}