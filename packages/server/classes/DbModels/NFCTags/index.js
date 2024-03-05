export default {
    name: "NFCTag",
    collection: "nfc_tags",
    schema: {
        user_id: {
            type: String,
            required: true
        },
        owner_id: {
            type: String,
            required: true
        },
        serial: {
            type: String,
            required: true
        },
        alias: {
            type: String,
            default: "My NFC Tag"
        },
        active: {
            type: Boolean,
            default: true
        },
        behavior: {
            type: Object,
            default: {
                type: "url",
                value: "https://comty.app"
            }
        },
        endpoint_url: {
            type: String,
            default: "https://comty.app/nfc/no_endpoint"
        }
    }
}