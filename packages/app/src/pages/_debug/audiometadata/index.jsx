import TrackManifest from "@cores/player/classes/TrackManifest"

const D_Manifest = () => {
	const [manifest, setManifest] = React.useState(null)

	function selectLocalFile() {
		const input = document.createElement("input")
		input.type = "file"
		input.accept = "audio/*"
		input.onchange = (e) => {
			loadManifest(e.target.files[0])
		}
		input.click()
	}

	async function loadManifest(file) {
		let track = new TrackManifest({ file: file })

		await track.initialize()

		console.log(track)

		setManifest(track)
	}

	return (
		<div className="flex-column gap-10">
			<p>Select a local file to view & create a track manifest</p>

			<button onClick={selectLocalFile}>Select</button>

			{manifest?.cover && (
				<img
					src={manifest.cover}
					alt="Cover"
					style={{ width: "100px", height: "100px" }}
				/>
			)}

			<code style={{ whiteSpace: "break-spaces", width: "300px" }}>
				{JSON.stringify(manifest)}
			</code>
		</div>
	)
}

export default D_Manifest
