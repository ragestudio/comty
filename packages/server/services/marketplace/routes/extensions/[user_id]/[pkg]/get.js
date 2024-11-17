import ExtensionClass from "@classes/extension"

export default async (req) => {
    const { user_id, pkg } = req.params

    return await ExtensionClass.resolveManifest({
        user_id,
        pkg,
    })
}