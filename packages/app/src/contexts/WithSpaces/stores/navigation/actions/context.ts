import { StoreApi } from "zustand"
import type { SpacesNavigationStoreType } from "../types"

export type SetNavState = StoreApi<SpacesNavigationStoreType>["setState"]
export type GetNavState = StoreApi<SpacesNavigationStoreType>["getState"]
