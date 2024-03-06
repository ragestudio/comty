import mongoose, { Schema } from "mongoose"
import fs from "fs"
import path from "path"

function generateModels() {
    let models = {}

    const dirs = fs.readdirSync(__dirname).filter(file => file !== "index.js")

    dirs.forEach((file) => {
        const model = require(path.join(__dirname, file)).default

        if (mongoose.models[model.name]) {
            return models[model.name] = mongoose.model(model.name)
        }

        return models[model.name] = mongoose.model(model.name, new Schema(model.schema), model.collection)
    })

    return models
}

module.exports = generateModels()