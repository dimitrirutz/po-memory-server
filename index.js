const { createServer } = require('http')
const { instrument } = require('@socket.io/admin-ui')
const { Server } = require("socket.io")
const mongoose = require("mongoose");
const Player = require('./Models/players.model')
const Game = require('./Models/games.model')
const AbstractPlayer = require("./AbstractPlayer");
const getScores = require("./functions/helper");
const fs = require("fs")


mongoose.connect('mongodb://127.0.0.1:27017/memory')
mongoose.connection.on('error', (err) => {
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.');
    process.exit();
    throw err
});


const https = createServer()
const io = new Server(https, {
    cors: {
        origin: [
            "https://admin.socket.io",
            "http://localhost:8000",
            "http://172.20.10.3:8000",
            "https://po21.drutz.ch",
            "http://po21.drutz.ch",
            "http://localhost:3333",
            "https://po2021.mediamatique.ch"
        ],
        credentials: true
    }
})

let Memory = {
    status: false,
}



async function getReadyPlayers() {
    return Player.find({
        status: true
    });
}

async function updateWaitingList() {
    io.to("host").emit("update-waiting-list", await waitingList())
}


async function getSocketPlayer(socket) {
    return Player.findOne({
        id: socket.uuid
    });
}

async function waitingList() {
    return Player.find({
        status: true,
        joinedAt: -1
    });
}

async function waitingListPosition(socket) {
    let players = await waitingList()
    for (let p of players){
        if(p.id === socket.player.id){
            return players.indexOf(p)
        }
    }
}

async function sendPosition(socket) {
    socket.emit("player-position", await waitingListPosition(socket))
}

function isPlayersInWaitingList() {
    waitingList().then(r => {
        let count = 0
        for (let p of r) {
            if (r) {
                count++
            }
        }
        if (count > 0 && !Memory.status) {
            io.to("host").emit("next-start", r[0])
        }
    })
}


async function hello() {
    let scores = await getScores(io)
    scores = JSON.stringify(scores)
    fs.writeFile("./memory.json", scores, 'utf-8', (data) => {
        console.log(data)
    })
}

setInterval(async () => {
    let scores = await getScores(io)
    io.to("query").emit("scores", scores)
}, 1000)


io.on("connection", (socket) => {

    let p


    socket.on("reload", () => {
        io.to("host").emit("reload")
    })

    if(socket.handshake.auth.token){
        p = new AbstractPlayer()
        p.setPlayerFromSocket(socket)
        isPlayersInWaitingList()
        updateWaitingList()
    }

    socket.on("host-join", async () => {
        socket.join(["host", "query"])
    })

    socket.onAny(async (data) => {
        console.log(Memory)
        setTimeout(async () => {
            isPlayersInWaitingList()
            await updateWaitingList()
        }, 500)

        let scores = await getScores()
        io.to("query").emit("scores", scores)
    })

    let abortGame = null

    socket.on("player-ready-to-start", async player => {

        p = new AbstractPlayer()
        console.log({ready: player})
        p.setPlayerById(player._id).then(r => {
            p.toggleUser()
            p.update()
            Memory.status = true
            abortGame = setTimeout(() => {
                socket.emit("abort")
                Memory.status = false
                isPlayersInWaitingList()
            }, 20000)
        })
        await updateWaitingList()



    })


    socket.on("stop", async ({game, stats}) => {
        if(game) {
            if(abortGame) { clearTimeout(abortGame) }
            let g = await Game.findById(game._id)
            g.endedAt = new Date()
            g.tries = stats.tries
            g.save().then(r => {
                console.log(r)
                Memory.status = false
                isPlayersInWaitingList()
            })
        }
        else{
            Memory.status = false
            if(abortGame) { clearTimeout(abortGame) }
            isPlayersInWaitingList()
        }

        let scores = await getScores()
        let scoresCPNV = await getScoresCPNV()
        io.to("query").emit("scores", scores)
        io.to("query").emit("scores-cpnv", scoresCPNV)
    })

    socket.on("start", async () => {
        if (abortGame) {
            clearTimeout(abortGame)
        }
        Memory.status = true
        p.gameStart().then(r => {
            socket.emit("game-info", r)
        })

        let scores = await getScores()
        io.to("query").emit("scores", scores)
    })

    socket.on("query-join", () => {
        socket.join("query")
        console.log("Query room joined")
    })

})



instrument(io, {
    auth: false
});

console.log("Listening on 53333")
https.listen(53333)

