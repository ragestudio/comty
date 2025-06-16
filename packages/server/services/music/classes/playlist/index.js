import getData from "./methods/getData"
import create from "./methods/create"
import modify from "./methods/modify"
import deletePlaylist from "./methods/deletePlaylist"

import appendItem from "./methods/appendItem"
import removeItem from "./methods/removeItem"

export default class Playlist {
	static get = getData
	static create = create
	static modify = modify
	static delete = deletePlaylist

	static appendItem = appendItem
	static removeItem = removeItem
}
