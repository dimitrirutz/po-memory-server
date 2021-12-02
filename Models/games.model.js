const mongoose = require("mongoose")
const Schema = mongoose.Schema

const GameSchema = new Schema({
    tries: {type: Number},
    penality: {type: Number},
    startedAt: {type: Date},
    endedAt: {type: Date},
    player: {type: Schema.Types.ObjectId, ref: 'Player'}
})

module.exports = mongoose.model('Game', GameSchema, 'games')