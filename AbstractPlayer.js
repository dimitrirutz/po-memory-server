const Player = require('./Models/players.model')
const Game = require('./Models/games.model')

module.exports = class AbstractPlayer {

    /**
     * @property {Player} player
     */
    player
    socket
    games = []


    constructor() {

    }

    /**
     * @param {Socket} socket
     */
    setPlayerFromSocket(socket)
    {
        let id = socket.handshake.auth.token
        this.socket = socket

        Player.findOne({id: id})
            .then(r => {
                if(!r){
                    this.player = new Player({id: id})
                    this.update().then(r => console.log("Player inserted in database"))
                }
                else{
                    this.player = r
                    console.log("Player is in databases")
                }
                this.sendDetailsToUser()
                this.handleActions()
            })
    }

    async setPlayerById(id){
        this.player = await Player.findById(id)
        return this
    }



    sendDetailsToUser(){
        let output = {
            id: this.player.id,
            username: this.player.username,
            email: this.player.email,
            position: this.playerPosition()
        }

        this.socket.emit("player", this.player)
    }

    handleActions() {
        this.socket.on("want-to-play", (data) => this.updateUser(data))
    }

    updateUser(data) {
        let mail = data.email.toString()

        if(mail.match(/\bcpnv.ch\b$/)) {
            this.player.isCPNV = true
        }

        this.player.username = data.username
        this.player.email = data.email
        this.toggleUser()
        this.update().then(r => console.log("Player updated in database"))
    }


    toggleUser(){
        this.player.status = !this.player.status
    }

    async getPlayer() {
        return Player.findById(this.player._id);
    }

    async update () {
        await this.player.save()
        if(this.socket) {
            await this.sendDetailsToUser()
        }
    }

    async playerPosition() {
        let players = await this.waitingList()
        for (let p of players){
            if(p.id === this.player.id){
                return players.indexOf(p)
            }
        }
        return null
    }

    async waitingList(){
        return Player.find({
            status: true,
            joinedAt: -1
        })
    }   

    async gameStart() {
        this.games.push(await Game.create({
            player: this.player._id,
            startedAt: new Date()
        }))
        console.log("New game created")
        return this.games[this.games.length - 1]
    }
}