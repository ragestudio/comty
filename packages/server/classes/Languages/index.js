import Data from "./data.json"

export default class Languages {
    get() {
        return Data
    }

    resolveName(code) {
        return Data[code]
    }
}