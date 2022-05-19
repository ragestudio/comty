import mongoose from "mongoose"

function getConnectionConfig(obj) {
    const { db_user, db_driver, db_name, db_pwd, db_hostname, db_port } = obj

    return [`${db_driver ?? "mongodb"}://${db_user ? `${db_user}` : ""}${db_pwd ? `:${db_pwd}` : ""}${db_user ? "@" : ""}${db_hostname ?? "localhost"}:${db_port ?? "27017"}${db_user ? "/?authMechanism=DEFAULT" : ""}`, {
        dbName: db_name,
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }]
}

export default class DBManager {
    env = process.env

    connect = () => {
        return new Promise((resolve, reject) => {
            try {
                console.log("🌐 Trying to connect to DB...")
                const dbConfig = getConnectionConfig(this.env)

                mongoose.connect(...dbConfig)
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