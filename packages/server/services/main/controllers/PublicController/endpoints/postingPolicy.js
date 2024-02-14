export default {
    method: "GET",
    route: "/posting_policy",
    middlewares: ["withOptionalAuthentication"],
    fn: async (req, res) => {
        // TODO: Use `PermissionsAPI` to get the user's permissions and return the correct policy, by now it will return the default policy
        return res.json(global.DEFAULT_POSTING_POLICY)
    }
}