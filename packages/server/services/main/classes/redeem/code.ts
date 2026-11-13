import crypto from "node:crypto"

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
const CODE_LENGTH = 16

export type GeneratedCode = {
	code: string
	hash: string
	hint: string
}

export function normalizeCode(code: unknown): string {
	return String(code ?? "")
		.toUpperCase()
		.replace(/[^0-9A-Z]/g, "")
		.replace(/[IL]/g, "1")
		.replace(/O/g, "0")
}

export function hashCode(code: unknown): string {
	return crypto.createHash("sha256").update(normalizeCode(code)).digest("hex")
}

export function generateCode(): GeneratedCode {
	const bytes = crypto.randomBytes(CODE_LENGTH)

	let raw = ""

	for (let index = 0; index < CODE_LENGTH; index++) {
		raw += ALPHABET[bytes[index] % ALPHABET.length]
	}

	return {
		code: raw.match(/.{1,4}/g).join("-"),
		hash: hashCode(raw),
		hint: raw.slice(-4),
	}
}
