// Type declarations for @shared-utils modules

declare module "@shared-utils/setFind" {
	/**
	 * Find an item in a Set that matches the predicate function
	 * @param set The Set to search
	 * @param fn Predicate function that returns true for the matching item
	 * @returns The found item or undefined if not found
	 */
	export default function setFind<T>(
		set: Set<T>,
		fn: (item: T) => boolean,
	): T | undefined
}

declare module "@shared-utils/requiredFields" {
	/**
	 * Validate that required fields are present in an object
	 * @param fields Array of required field names
	 * @param object The object to validate
	 * @throws Error if any required field is missing
	 */
	export default function requiredFields(
		fields: string[],
		object: Record<string, any>,
	): void
}

declare module "@shared-utils/obscureEmail" {
	/**
	 * Obscure an email address for display
	 * @param email The email address to obscure
	 * @returns The obscured email address
	 */
	export default function obscureEmail(email: string): string
}

declare module "@shared-utils/isEmail" {
	/**
	 * Check if a string is a valid email address
	 * @param email The string to check
	 * @returns True if the string is a valid email address
	 */
	export default function isEmail(email: string): boolean
}

declare module "@shared-utils/readChunk" {
	/**
	 * Read a chunk from a file
	 * @param filePath Path to the file
	 * @param options Options for reading the chunk
	 * @returns Promise that resolves with the chunk buffer
	 */
	export default function readChunk(
		filePath: string,
		options: { length: number; startPosition?: number },
	): Promise<Buffer>
}

declare module "@shared-utils/bufferToStream" {
	/**
	 * Convert a buffer to a readable stream
	 * @param buffer The buffer to convert
	 * @returns A readable stream
	 */
	export default function bufferToStream(
		buffer: Buffer,
	): import("stream").Readable
}

declare module "@shared-utils/readFileHash" {
	/**
	 * Calculate the hash of a file from a stream
	 * @param stream The file stream
	 * @returns Promise that resolves with the file hash
	 */
	export default function readFileHash(
		stream: import("stream").Readable,
	): Promise<string>
}
