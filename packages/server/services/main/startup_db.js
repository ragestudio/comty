import { Config } from "@db_models"

export default async () => {
    let serverConfig = await Config.findOne({ key: "server" }).catch(() => {
        return false
    })

    if (!serverConfig) {
        console.log("Server config DB is not created, creating it...")

        serverConfig = new Config({
            key: "server",
            value: {
                setup: false,
            },
        })

        await serverConfig.save()
    }

    const setupScriptsCompleted = (serverConfig.value?.setup) ?? false

    if (!setupScriptsCompleted) {
        console.log("⚠️  Server setup is not complete, running setup proccess.")

        let setupScript = await import("./setup")
        setupScript = setupScript.default ?? setupScript

        try {
            for await (let script of setupScript) {
                await script()
            }

            console.log("✅  Server setup complete.")

            await Config.updateOne({ key: "server" }, { value: { setup: true } })

            serverConfig = await Config.findOne({ key: "server" })

            return resolve()
        } catch (error) {
            console.log("❌  Server setup failed.")
            console.error(error)
            process.exit(1)
        }
    }
}