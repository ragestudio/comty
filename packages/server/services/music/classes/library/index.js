import Track from "@db_models/track"
import Playlist from "@db_models/playlist"
import MusicRelease from "@db_models/musicRelease"

import toggleFavorite from "./methods/toggleFavorite"
import getUserLibrary from "./methods/getUserLibrary"
import isFavorite from "./methods/isFavorite"

export default class Library {
	static kindToModel = {
		tracks: Track,
		playlists: Playlist,
		releases: MusicRelease,
	}

	static toggleFavorite = toggleFavorite
	static getUserLibrary = getUserLibrary
	static isFavorite = isFavorite
}
