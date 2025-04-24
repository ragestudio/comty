export default function readChunk(
	filePath: string,
	options: {
		length: number
		startPosition: number
	},
): Promise<Uint8Array>
