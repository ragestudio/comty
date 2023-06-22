const dns = require("dns")
const os = require("os")

module.exports = () => new Promise((resolve, reject) => {
    dns.lookup(os.hostname(), (err, address, family) => {
        if (err) {
            reject(err)
        }

        resolve(address)
    })
})