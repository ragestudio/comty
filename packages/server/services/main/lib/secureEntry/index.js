import crypto from "crypto"

export default class SecureEntry {
    constructor(model, params = {}) {
        this.params = params

        if (!model) {
            throw new Error("Missing model")
        }

        this.model = model
    }

    static get encrytionAlgorithm() {
        return "aes-256-cbc"
    }

    async set(key, value, {
        keyName = "key",
        valueName = "value",
    }) {
        if (!keyName) {
            throw new Error("Missing keyName")
        }

        if (!valueName) {
            throw new Error("Missing valueName")
        }

        if (!key) {
            throw new Error("Missing key")
        }

        if (!value) {
            throw new Error("Missing value")
        }

        let entry = await this.model.findOne({
            [keyName]: key,
            [valueName]: value,
        }).catch(() => null)

        const encryptionKey = Buffer.from(process.env.SYNC_ENCRIPT_SECRET, "hex")
        const iv = crypto.randomBytes(16)

        const cipher = crypto.createCipheriv(SecureEntry.encrytionAlgorithm, encryptionKey, iv)

        let encryptedData

        try {
            encryptedData = cipher.update(value)
        }
        catch (error) {
            console.error(error)
        }

        encryptedData = Buffer.concat([encryptedData, cipher.final()])

        value = iv.toString("hex") + ":" + encryptedData.toString("hex")

        if (entry) {
            entry[valueName] = value

            await entry.save()

            return entry
        }

        entry = new this.model({
            [keyName]: key,
            [valueName]: value,
        })

        await entry.save()

        return entry
    }

    async get(key, value, {
        keyName = "key",
        valueName = "value",
    }) {
        if (!keyName) {
            throw new Error("Missing keyName")
        }
        if (!key) {
            throw new Error("Missing key")
        }

        const searchQuery = {
            [keyName]: key,
        }

        if (value) {
            searchQuery[valueName] = value
        }

        const entry = await this.model.findOne(searchQuery).catch(() => null)

        if (!entry || !entry[valueName]) {
            return null
        }

        const encryptionKey = Buffer.from(process.env.SYNC_ENCRIPT_SECRET, "hex")

        const iv = Buffer.from(entry[valueName].split(":")[0], "hex")
        const encryptedText = Buffer.from(entry[valueName].split(":")[1], "hex")

        const decipher = crypto.createDecipheriv(SecureEntry.encrytionAlgorithm, encryptionKey, iv)

        let decrypted = decipher.update(encryptedText)

        decrypted = Buffer.concat([decrypted, decipher.final()])

        return decrypted.toString()
    }

    async deleteByID(_id) {
        if (!_id) {
            throw new Error("Missing _id")
        }

        const entry = await this.model.findById(_id).catch(() => null)

        if (!entry) {
            return null
        }

        await entry.delete()

        return entry
    }
}