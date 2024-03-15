export default {
    useContext: ["cache", "limits"],
    fn: async () => {
        return this.default.contexts.limits
    }
}