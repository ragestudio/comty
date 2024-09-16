const fs = require("fs")
const sevenzip = require("7zip-min")

async function compressDistBundle(origin, output) {
    // compress with 7zip
    console.log("⚒  Compressing app...")

    // check if out file exists
    if (fs.existsSync(output)) {
        fs.unlinkSync(output)
    }

    await new Promise((resolve, reject) => {
        sevenzip.pack(origin, output, (err) => {
            if (err) {
                return reject(err)
            }

            return resolve(output)
        })
    })

    console.log("⚒  Compressing app done! > " + output)

    return output
}

module.exports = compressDistBundle