import cors from "cors"

export default cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD", "CONNECT", "TRACE"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
})