export default {
    route: "/ping",
    method: "GET",
    fn: async (req, res) => {
        return res.send("pong")
    }
}