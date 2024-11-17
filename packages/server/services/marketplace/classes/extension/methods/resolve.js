import { Extension } from "@db_models"

export default async function resolve(payload) {
    let { user_id, pkg } = payload

    const [pkgName, pkgVersion] = pkg.split("@")

    if (!pkgVersion) {
        pkgVersion = "latest"
    }

    if (pkgVersion === "latest") {
        return await Extension.findOne({
            user_id,
            name: pkgName,
        }).sort({ version: -1 }).limit(1).exec()
    }

    return await Extension.findOne({
        user_id,
        name: pkgName,
        version: pkgVersion,
    })
}