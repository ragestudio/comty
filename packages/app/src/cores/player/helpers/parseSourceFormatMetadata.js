import { parseWebStream } from "music-metadata"

export default async (source) => {
	const stream = await fetch(source, {
		method: "GET",
		headers: {
			//Range: "bytes=0-1024",
		},
	}).then((response) => response.body)

	return (await parseWebStream(stream)).format
}
