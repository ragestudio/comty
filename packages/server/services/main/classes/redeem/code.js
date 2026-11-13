import crypto from "node:crypto"

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
const CODE_LENGTH = 16

export function normalizeCode(code) {
	return String(code ?? "")
		.toUpperCase()
		.replace(/[^0-9A-Z]/g, "")
		.replace(/[IL]/g, "1")
		.replace(/O/g, "0")
}

export function hashCode(code) {
	return crypto.createHash("sha256").update(normalizeCode(code)).digest("hex")
}

export function generateCode() {
	const bytes = crypto.randomBytes(CODE_LENGTH)

	let code = ""

	for (let index = 0; index < CODE_LENGTH; index++) {
		code += ALPHABET[bytes[index] % ALPHABET.length]
	}

	return {
		code: code.match(/.{1,4}/g).join("-"),
		hash: hashCode(code),
		hint: code.slice(-4),
	}
}
