import { SyncEntry } from "../../../models"

import crypto from "crypto"

export default class SecureSyncEntry {
    static get encrytionAlgorithm() {
        return "aes-256-cbc"
    }

    static async set(user_id, key, value) {
        if (!user_id) {
            throw new Error("Missing user_id")
        }

        if (!key) {
            throw new Error("Missing key")
        }

        if (!value) {
            throw new Error("Missing value")
        }

        let entry = await SyncEntry.findOne({ key }).catch(() => null)

        const encryptionKey = Buffer.from(process.env.SYNC_ENCRIPT_SECRET, "hex")
        const iv = crypto.randomBytes(16)

        const cipher = crypto.createCipheriv(SecureSyncEntry.encrytionAlgorithm, encryptionKey, iv)

        let encrypted

        try {
            encrypted = cipher.update(value)
        }
        catch (error) {
            console.error(error)
        }

        encrypted = Buffer.concat([encrypted, cipher.final()])

        if (entry) {
            entry.value = iv.toString("hex") + ":" + encrypted.toString("hex")

            await entry.save()

            return entry
        }

        entry = new SyncEntry({
            user_id,
            key,
            value: iv.toString("hex") + ":" + encrypted.toString("hex"),
        })

        await entry.save()

        return entry
    }

    static async get(user_id, key) {
        if (!user_id) {
            throw new Error("Missing user_id")
        }

        if (!key) {
            throw new Error("Missing key")
        }

        const entry = await SyncEntry.findOne({
            user_id,
            key,
        }).catch(() => null)

        if (!entry) {
            return null
        }

        const encryptionKey = Buffer.from(process.env.SYNC_ENCRIPT_SECRET, "hex")

        const iv = Buffer.from(entry.value.split(":")[0], "hex")
        const encryptedText = Buffer.from(entry.value.split(":")[1], "hex")

        const decipher = crypto.createDecipheriv(SecureSyncEntry.encrytionAlgorithm, encryptionKey, iv)

        let decrypted = decipher.update(encryptedText)

        decrypted = Buffer.concat([decrypted, decipher.final()])

        return decrypted.toString()
    }

    static async delete(user_id, key) {
        if (!user_id) {
            throw new Error("Missing user_id")
        }

        if (!key) {
            throw new Error("Missing key")
        }

        const entry = await SyncEntry.findOne({
            user_id,
            key,
        }).catch(() => null)

        if (!entry) {
            return null
        }

        await entry.delete()

        return entry
    }
}