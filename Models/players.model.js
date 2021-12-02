const mongoose = require("mongoose")
const Schema = mongoose.Schema

const PlayerSchema = new Schema({
    id: {type: String, required: true},
    username: {type: String},
    email: {type: String},
    joindedAt: {type: Date, default: new Date()},
    status: {type: Boolean, default: false},
    isCPNV: {type: Boolean}
})

module.exports = mongoose.model('Player', PlayerSchema, 'players')