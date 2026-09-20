import { create } from "zustand"
import { DMStoreType } from "./types"

export const DMStore = create<DMStoreType>()((set, get) => {
	return {}
})

export default DMStore
