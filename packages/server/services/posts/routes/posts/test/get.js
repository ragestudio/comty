export default async (req, res) => {
    await new Promise((r) => {
        setTimeout(r, 1000)
    })

    return {
        code: 0,
        message: "success",
    }
}