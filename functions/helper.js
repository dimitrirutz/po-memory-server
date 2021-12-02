const Game = require('../Models/games.model')
const Player = require('../Models/players.model')

const getScores = async (io) => {
    const pountos = [50,41,33,26,20,15,11,8,6,5]

    let games = await Game.find({
        endedAt: {$exists: 1}
    })

    let scores = []

    let index = 0

    for (let game of games) {
        let start = new Date(game.startedAt).getTime()
        let end = new Date(game.endedAt).getTime()

        let time = Math.floor((end - start) / 1000)

        let score = time + game.tries

        let player = await Player.findById(game.player)

        scores.push({
            score: score,
            player: player.username,
            email: player.email,
            pountos: pountos[index] ?? 0
        })
        index++
    }

    scores.sort(function (a, b) {
        return a.score - b.score;
    });

    let output = []

    for (let i = 0; i < scores.length; i++){
        scores[i].pountos = pountos[i]
        output.push(scores[i])
    }

    return output
}
const getScoresCPNV = async () => {
    const pountos = [50,41,33,26,20,15,11,8,6,5]

    let games = await Game.find({
        isCPNV: true,
        endedAt: {$exists: 1}
    })

    let scores = []

    let index = 0

    for (let game of games) {
        let start = new Date(game.startedAt).getTime()
        let end = new Date(game.endedAt).getTime()

        let time = Math.floor((end - start) / 1000)

        let score = time + game.tries

        let player = await Player.findById(game.player)

        scores.push({
            score: score,
            player: player.username,
            pountos: pountos[index] ?? 0
        })
        index++
    }

    scores.sort(function (a, b) {
        return a.score - b.score;
    });
    let output = []

    for (let i = 0; i < 10; i++){
        output.push(scores[i])
    }

    console.log(output)

    return output
}


module.exports = getScores