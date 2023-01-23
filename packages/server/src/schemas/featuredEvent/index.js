export default {
    name: { type: String, required: true },
    category: { type: String },
    description: { type: String },
    dates: { type: Object },
    location: { type: String },
    announcement: { type: Object, required: true },
    expired: { type: Boolean, default: false }
}