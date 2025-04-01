import ChildProcess from "node:child_process"

export default async (cwd) => {
    // git check-ignore -- *
    let output = await new Promise((resolve, reject) => {
        ChildProcess.exec("git check-ignore -- *", {
            cwd: cwd
        }, (err, stdout) => {
            if (err) {
                resolve(``)
            }

            resolve(stdout)
        })
    })

    output = output.split("\n").map((file) => {
        return `**/${file.trim()}`
    })

    output = output.filter((file) => {
        return file
    })

    return output
}
