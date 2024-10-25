export default {
    name: "User",
    collection: "accounts",
    schema: {
        username: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true,
            select: false
        },
        email: {
            type: String,
            required: true,
            select: false
        },
        description: {
            type: String,
            default: null
        },
        created_at: {
            type: String
        },
        public_name: {
            type: String,
            default: null
        },
        cover: {
            type: String,
            default: null
        },
        avatar: {
            type:
                String,
            default: null
        },
        roles: {
            type: Array,
            default: []
        },
        verified: {
            type: Boolean,
            default: false
        },
        badges: {
            type: Array,
            default: []
        },
        links: {
            type: Array,
            default: []
        },
        location: {
            type: String,
            default: null
        },
        birthday: {
            type: Date,
            default: null,
            select: false
        },
        accept_tos: {
            type: Boolean,
            default: false
        },
        activated: {
            type: Boolean,
            default: false,
        }
    }
}