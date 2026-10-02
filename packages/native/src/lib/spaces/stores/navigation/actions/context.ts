import type { NavigationStoreType } from "../types"

import { StoreApi } from "zustand"

export type SetNavState = StoreApi<NavigationStoreType>["setState"]
export type GetNavState = StoreApi<NavigationStoreType>["getState"]
