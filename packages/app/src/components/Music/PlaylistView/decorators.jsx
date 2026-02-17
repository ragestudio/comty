import { Icons } from "@components/Icons"

const PlaylistTypeDecorators = {
	single: () => (
		<span className="playlistType">
			<Icons.DiscAlbum /> Single
		</span>
	),
	album: () => (
		<span className="playlistType">
			<Icons.SquareLibrary /> Album
		</span>
	),
	ep: () => (
		<span className="playlistType">
			<Icons.DiscAlbum /> EP
		</span>
	),
	mix: () => (
		<span className="playlistType">
			<Icons.Turntable /> Mix
		</span>
	),
}

export default PlaylistTypeDecorators
