import Dexie from "dexie"

export default class StoragedState {
    constructor() {
        this.db = new Dexie("storaged_states")

        this.db.version(1).stores({
            states: "id,value",
        })
    }

    getState = async (stateKey) => {
        const data = await this.db.table("states").get(stateKey)

        if (!data) {
            return null
        }

        return data.value
    }

    setState = async (stateKey, value) => {
        return await this.db.table("states").put({
            id: stateKey,
            value,
        })
    }
}