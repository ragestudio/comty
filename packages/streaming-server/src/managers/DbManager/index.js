import mongoose from "mongoose"

function parseConnectionString(obj) {
    const { db_user, db_driver, db_name, db_pwd, db_hostname, db_port } = obj
    return `${db_driver ?? "mongodb"}://${db_user ? `${db_user}` : ""}${db_pwd ? `:${db_pwd}` : ""}${db_user ? "@" : ""}${db_hostname ?? "localhost"}:${db_port ?? ""}/${db_name ?? ""}`
}

export default class DBManager {
    constructor() {
        this.env = process.env
    }

    connect = () => {
        return new Promise((resolve, reject) => {
            try {
                console.log("🌐 Trying to connect to DB...")
                const dbUri = parseConnectionString(this.env)

                //console.log(dbUri)

                mongoose.connect(dbUri, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                })
                    .then((res) => { return resolve(true) })
                    .catch((err) => { return reject(err) })
            } catch (err) {
                return reject(err)
            }
        }).then(done => {
            console.log(`✅ Connected to DB`)
        }).catch((error) => {
            console.log(`❌ Failed to connect to DB, retrying...\n`)
            console.log(error)
            setTimeout(() => {
                this.connect()
            }, 1000)
        })
    }
}