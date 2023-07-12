import { Schema } from "mongoose"

export default {
    name: "ServerLimit",
    collection: "serverLimits",
    schema: {
        key: {
            type: String,
            required: true,
        },
        value: {
            type: Schema.Types.Mixed,
            required: true,
        },
        active: {
            type: Boolean,
            default: true,
        },
        data: {
            type: Object,
            required: false,
        }
    }
}