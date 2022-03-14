import { genV1 } from "../../essc"

export default (obj) => {
    obj.essc = genV1({
        type: obj.vaultItemTypeSelector ?? obj.type,
        serial: obj.vaultItemSerial ?? obj.serial,
        manufacturer: obj.vaultItemManufacturer ?? obj.manufacturer,
    })

    return obj
}