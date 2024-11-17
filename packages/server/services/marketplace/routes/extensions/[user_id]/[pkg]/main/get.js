import ExtensionClass from "@classes/extension"

export default async (req, res) => {
    const { user_id, pkg } = req.params

    const manifest = await ExtensionClass.resolve({
        user_id,
        pkg,
    })

    return manifest
} 