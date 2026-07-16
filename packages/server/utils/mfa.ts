import crypto from "node:crypto"

const algorithm = "aes-256-gcm"
const secretKey = process.env.MFA_ENCRYPTION_KEY

if (!secretKey || secretKey.length < 32) {
	throw new Error("MFA_ENCRYPTION_KEY must be at least 32 characters long")
}

const key = crypto.scryptSync(secretKey, "salt", 32)

/**
 * Encrypt a text using AES-256-GCM
 * @param text The text to encrypt
 * @returns Object containing encrypted text, iv, and auth tag
 */
export function encrypt(text: string) {
	const iv = crypto.randomBytes(12)
	const cipher = crypto.createCipheriv(algorithm, key, iv)

	let encrypted = cipher.update(text, "utf8", "hex")
	encrypted += cipher.final("hex")

	const authTag = cipher.getAuthTag().toString("hex")

	return {
		encryptedText: encrypted,
		iv: iv.toString("hex"),
		authTag,
	}
}

/**
 * Decrypt a text using AES-256-GCM
 * @param encryptedText The encrypted text in hex
 * @param iv The initialization vector in hex
 * @param authTag The authentication tag in hex
 * @returns The decrypted text
 */
export function decrypt(encryptedText: string, iv: string, authTag: string) {
	const decipher = crypto.createDecipheriv(
		algorithm,
		key,
		Buffer.from(iv, "hex"),
	)

	decipher.setAuthTag(Buffer.from(authTag, "hex"))

	let decrypted = decipher.update(encryptedText, "hex", "utf8")
	decrypted += decipher.final("utf8")

	return decrypted
}
