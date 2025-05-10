import { Icons } from "@components/Icons"

const PlaylistTypeDecorators = {
	single: () => (
		<span className="playlistType">
			<Icons.MdMusicNote /> Single
		</span>
	),
	album: () => (
		<span className="playlistType">
			<Icons.MdAlbum /> Album
		</span>
	),
	ep: () => (
		<span className="playlistType">
			<Icons.MdAlbum /> EP
		</span>
	),
	mix: () => (
		<span className="playlistType">
			<Icons.MdMusicNote /> Mix
		</span>
	),
}

export default PlaylistTypeDecorators
