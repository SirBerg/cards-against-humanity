import express from 'express'
import {Database} from 'bun:sqlite'
import coordinator, {gameTable} from './v1/game/coordinator'
import type {card, memoryCards, clientType, gamesType} from '@/lib/types'
import {uuidv7} from "@/utils/uuid";
import cors from 'cors'
import {Logger} from "@/lib/logger";
const log = new Logger()
log.setJsonLogging(false)
log.setLogLevel('DEBUG')
const app = express()
const db = new Database('data/main.sqlite3')
const gameDB = new Database(':memory:')

//create the games table
gameDB.query(`
    CREATE TABLE IF NOT EXISTS games
        (
            id STRING PRIMARY KEY NOT NULL,
            ownerID STRING,
            allowedPacks STRING,
            allowedIDs STRING,
            bannedIDs STRING,
            started BOOLEAN,
            startedAt STRING,
            ended BOOLEAN,
            allowBlackCardDupes BOOLEAN,
            blackCardsPlayed STRING
        );
`).all()

// eslint-disable-next-line @typescript-eslint/no-require-imports
var expressWs = require('express-ws')(app)
app.use(cors())
app.use(express.json())
//get all the manifest IDs
const manifestIDs = db.query('SELECT id FROM manifest').all().map((row: any)=>row.id)

//create the cards object so we can avoid querying the database for every card
const cards = db.query('SELECT * FROM cards').all()
log.debug(`Found ${cards.length} cards in the database, building RAM object`)
const memoryCards: memoryCards = {};

(cards as card[]).forEach((card: card) => {
  if(typeof card.packID !== 'undefined'){
    if(!memoryCards[card.packID]){
        memoryCards[card.packID] = {
            black: {},
            white: {},
            blackCount: 0,
            whiteCount: 0
        }
    }
    if(card.type == 'black'){
        memoryCards[card.packID].blackCount++
        memoryCards[card.packID].black[card.id] = card
    }
    else{
        memoryCards[card.packID].whiteCount++
        memoryCards[card.packID].white[card.id] = card
    }
  }
})
log.debug('Finished building RAM object')


let games:gamesType = {}
function broadcastGameState(gameID:string){
    //send the clients the game state
    for(const usrID of Object.keys(games[gameID].websockets)){
        const clientWS = games[gameID].websockets[usrID]
        log.debug(`Sending game state to client ${usrID}`)
        clientWS.send(
            JSON.stringify(
                {
                    type:'gameState',
                    game:{
                        ownerID: games[gameID].ownerID,
                        allowedPacks: games[gameID].allowedPacks,
                        bannedIDs: games[gameID].bannedIDs,
                        started: games[gameID].started,
                        startedAt: games[gameID].startedAt,
                        currentBlackCard: games[gameID].currentBlackCard,
                        clients: games[gameID].clients
                    }
                }
            )
        )
    }
}

app.get('/v2/card/:packid/:cardid', (req, res)=>{
    log.logRequest(req.url, 'GET')
    if(!req.params.cardid || Array.isArray(req.params.cardid)){
        res.status(400).json({error: 'Card ID required'})
        return
    }
    if(!req.params.packid || Array.isArray(req.params.packid) || !manifestIDs.includes(req.params.packid)){
        res.status(400).json({error:'Pack ID required'})
        return
    }
    const card = memoryCards[req.params.packid].black[req.params.cardid] ? memoryCards[req.params.packid].black[req.params.cardid] : memoryCards[req.params.packid].white[req.params.cardid]
    if(!card){
        res.status(404).json({error:'Card not found'})
        return
    }
    res.status(200).json(card)
})
//this handles updates to the packs made by the owner of a game
app.patch('/v2/game/coordinator/:gameid/packs', (req, res)=>{
    log.logRequest(req.url, 'PATCH')
    if(!req.headers.userid || Array.isArray(req.headers.userid)){
        res.status(400).send('User ID required')
        return
    }
    if(!req.params.gameid || Array.isArray(req.params.gameid)){
        res.status(400).send('Game ID required')
        return
    }
    if(req.headers.userid != games[req.params.gameid].ownerID){
        res.status(403).send('You are not the owner of this game')
        return
    }
    if(!games[req.params.gameid]){
        res.status(404).send('Game not found')
        return
    }
    //update the allowed packs for this game
    //games[req.params.gameid].allowedPacks = req.body
    if(!req.body || !req.body.packs || !Array.isArray(req.body.packs)){
        res.status(400).send('Packs required')
        return
    }
    for(const pack of req.body.packs){
        if(!manifestIDs.includes(pack)){
            res.status(400).send('Invalid pack ID')
            return
        }
    }
    games[req.params.gameid].allowedPacks = req.body.packs
    res.status(200).send('OK')
    broadcastGameState(req.params.gameid)
})
//create a new game with this endpoint
app.post('/v2/game/coordinator', (req, res)=>{
    log.logRequest(req.url, 'POST')
    //create a new game in the games table and return the ID to the sender
    if(!req.headers.userid || !req.headers.username || Array.isArray(req.headers.userid) || Array.isArray(req.headers.username) || req.headers.userid == 'undefined' || req.headers.username == 'undefined'){
        res.status(400).send('User ID and Name required')
        return
    }
    const gameID = uuidv7()
    log.debug(`Creating game with ID: ${gameID} and user ID: ${req.headers.userid}`)
    gameDB.query('DELETE FROM games WHERE ownerID = ?').run(req.headers.userid)
    gameDB.query('INSERT INTO games (id, ownerID, allowedPacks, allowedIDs, started, startedAt, ended, allowBlackCardDupes, blackCardsPlayed, bannedIDs) VALUES (?, ?, ? ,?, ?, ?, ?, ?, ?, ?)')
        .run(gameID, req.headers.userid.replaceAll('"', ''), '[]', JSON.stringify([{userID: req.headers.userid.replaceAll('"', ''), userName: req.headers.username, points: 0}]), false, 'null', false, false, '[]', '[]')
    res.status(200).json({gameID})
})


expressWs.app.ws('/v2/game/coordinator/:gameid', async(ws:WebSocket, req:Request)=>{
    function getRandomBlackCard(gameID:string):{cardID:string, pack:string}{
        function rand(){
            //get a random pack we should draw from
            let packID = Math.floor(Math.random() * games[gameID].allowedPacks.length)
            if(packID >= games[gameID].allowedPacks.length){
                packID = games[gameID].allowedPacks.length-1
            }
            const pack = games[gameID].allowedPacks[packID]
            const blackCardsPerPack = Object.keys(memoryCards[pack].black)
            if(blackCardsPerPack.length == 0){
                return {cardID: 'undefined', pack: 'undefined'}
            }
            let cardIndex = Math.floor(Math.random() * memoryCards[pack].blackCount)
            if(cardIndex >= blackCardsPerPack.length) {
                cardIndex = blackCardsPerPack.length - 1
            }
            if(!blackCardsPerPack[cardIndex]){
                return {cardID: 'undefined', pack: 'undefined'}
            }
            //get a random card from that pack
            const card = memoryCards[pack].black[blackCardsPerPack[cardIndex]]
            return {cardID: card.id, pack: pack}
        }
        let card = rand()
        while(card.cardID == 'undefined'){
            card = rand()
        }
        return card
    }
    //this function takes a gameID and a userID and updates their cards in such a way that they at most have 5 cards
    function drawWhiteCard(gameID:string, userID:string, replaceCard?:string){
        function getRandomWhiteCard():{cardID:string, pack:string}{
            //get a random pack we should draw from
            let packIndex = Math.floor(Math.random() * games[gameID].allowedPacks.length)
            if(packIndex >= games[gameID].allowedPacks.length){
                packIndex = games[gameID].allowedPacks.length-1
            }
            const pack = games[gameID].allowedPacks[packIndex]

            const cardsPerPack = Object.keys(memoryCards[pack].white)

            //make sure there are cards in this pack, else return immediately
            if(cardsPerPack.length == 0){
                return {cardID: 'undefined', pack: 'undefined'}
            }
            //get a random card from that pack
            let cardIndex = Math.floor(Math.random() * memoryCards[pack].whiteCount)
            if(cardIndex >= cardsPerPack.length){
                cardIndex = cardsPerPack.length-1
            }
            if(!cardsPerPack[cardIndex]){
                return {cardID: 'undefined', pack: 'undefined'}
            }
            const card = memoryCards[pack].white[cardsPerPack[cardIndex]]
            return {cardID: card.id, pack: pack}
        }

        if(games[gameID].clients[userID].cards.length >= 5){
            log.debug(`User ${userID} has or more cards, removing every card over 5`)
            //remove every card over 5
            while(games[gameID].clients[userID].cards.length > 5){
                games[gameID].clients[userID].cards.pop()
            }
            return
        }

        //check if we need to replace a card
        if(replaceCard){
            log.debug(`Replacing card ${replaceCard} for user ${userID}`)
            const index = games[gameID].clients[userID].cards.indexOf(replaceCard)
            if(index != -1){
                //remove the index
                games[gameID].clients[userID].cards.splice(index, 1)
                while(games[gameID].clients[userID].cards.length <= 4){
                    const card = getRandomWhiteCard()
                    if(card.cardID == 'undefined'){
                        log.debug('Card is undefined, trying another one')
                        continue
                    }
                    games[gameID].clients[userID].cards.push(card)
                }
            }
            else{
                log.error(`Card ${replaceCard} not found in user ${userID}'s hand`)
                return
            }
        }

        //fill the user's hand with cards until they have 5
        while(games[gameID].clients[userID].cards.length <= 4){
            const card = getRandomWhiteCard()
            if(card.cardID == 'undefined'){
                log.debug('Card is undefined, trying another one')
                continue
            }
            games[gameID].clients[userID].cards.push(card)
        }
    }


    log.logRequest(req.url, 'WS')
    log.debug(`Received Websocket connection for game ${req.params.gameid}, with userid: ${JSON.stringify(req.query.userid)} and username: ${JSON.stringify(req.query.username)}`)
    if(!req.params.gameid || !req.query.userid || Array.isArray(req.query.userid) || !req.query.username || Array.isArray(req.query.username)){
        log.debug('Closing connection because of: Game ID and User ID and Name required')
        ws.send(JSON.stringify({type:'error', text:'Game ID and User ID and Name required'}))
        ws.close()
        return
    }

    //check if the game exists in the database
    const game = gameDB.query('SELECT * FROM games WHERE id = ?').get(req.params.gameid)
    if(!game){
        log.debug('Closing connection because of: Game not found')
        ws.send(JSON.stringify({type:'error', text:'Game not found'}))
        ws.close()
        return
    }
    const gameID = game.id


    //check if the game is already in the games object
    if(!games[gameID]){
        games[gameID] = {
            ownerID: game.ownerID,
            allowedPacks: game.allowedPacks,
            bannedIDs: JSON.parse(game.bannedIDs),
            started: game.started != '0',
            startedAt: game.startedAt,
            currentBlackCard: {cardID: 'undefined', pack: 'undefined'},
            clients: {},
            websockets: {},
            requests: {},
            queue: []
        }
    }
    //check if the user is banned
    const banned = games[gameID].bannedIDs
    //check if the user is banned
    if(banned.includes(req.query.userid)){
        log.debug('Closing connection because of: User is banned')
        ws.send(JSON.stringify({type:'nah', text:'You are banned from this game'}))
        ws.close()
        return
    }

    //set some vars for the client
    const userIsOwner = game.ownerID == req.query.userid

    //add the user to the queue
    games[gameID].queue.push(req.query.userid)

    //create a new client
    const newClient:clientType = {
        userID: req.query.userid,
        userName: req.query.username,
        cards: [],
        points: 0,
        isConnected: true,
        isTurn: games[gameID].queue[0] == req.query.userid,
        submittedCards: []
    }
    //add the client to the game
    games[gameID].clients[newClient.userID] = newClient
    games[gameID].websockets[newClient.userID] = ws
    games[gameID].requests[newClient.userID] = req

    //check if the game is currently starting
    if(games[gameID].starting){
        //draw a white card for the user
        drawWhiteCard(gameID, newClient.userID)
    }
    log.debug(`Client ${newClient.userID} connected to game ${gameID}, broadcasting gameState`)
    broadcastGameState(gameID)

    ws.onmessage = (event)=>{
        log.debug(`Received message from client ${newClient.userID}: ${event.data}`)
        try{
            const message = JSON.parse(event.data)
            if(message.type == 'getGame'){
                broadcastGameState(gameID)
            }
            if(message.type == 'banUser' && message.userID && userIsOwner){
                //ban the user
                log.debug(`Banning user ${message.userID}`)
                games[gameID].bannedIDs.push(message.userID)

                //send a message to that client that they've been removed
                games[gameID].websockets[message.userID].send(JSON.stringify({type:'banUser'}))
                //remove that user from the game
                games[gameID].websockets[message.userID].close()
                //delete the user completely from the game object including their score
                delete games[gameID].clients[message.userID]
                delete games[gameID].websockets[message.userID]
                //we don't need to broadcast the game state here because we expect the server to broadcast it in the onclose event
            }
            //update the user's name
            if(message.type == 'updateUser' && message.userID && message.userName && message.userID == newClient.userID){
                log.debug(`Updating user ${games[gameID].clients[newClient.userID].userID}'s name to ${message.userName}`)
                games[gameID].clients[newClient.userID].userName = message.userName
                //broadcast the game state
                broadcastGameState(gameID)
            }

            //start the game
            if(message.type == 'startGame' && userIsOwner){
                log.debug(`Starting game ${gameID}`)
                games[gameID].starting = true

                //this means we need to fill the black card as well as the cards held by the clients
                //get a random black card
                games[gameID].currentBlackCard = getRandomBlackCard(gameID)
                //send a special startGame message to all clients
                for(const usrID of Object.keys(games[gameID].websockets)){
                    games[gameID].websockets[usrID].send(JSON.stringify({type:'startGame'}))
                }
            }
        }
        catch(e){
            log.error(`Error parsing JSON: ${e}`)
            return
        }
    }

    //handle the close event for this client
    ws.onclose = ()=>{
        log.debug(`Client ${newClient.userID} disconnected`)
        if(!games[gameID]){
            log.debug(`Game ${gameID} does not exist, closing connection`)
            ws.close()
            return
        }
        //set the client to disconnected, destroy their websocket and request objects but do NOT remove them from the game object to keep their scores for an eventual reconnection

        delete games[gameID].websockets[newClient.userID]
        delete games[gameID].requests[newClient.userID]
        //it might be that the client has been banned, meaning that they won't be kept in the game clients object so we need to account for that
        if(games[gameID].clients[newClient.userID]){
            games[gameID].clients[newClient.userID].isConnected = false
        }

        log.debug(`Clients remaining: ${Object.keys(games[gameID].websockets).length}`)
        log.debug(`Clients in game: ${Object.keys(games[gameID].clients).length}`)
        //send the clients the game state
        broadcastGameState(gameID)
        //check if the length of games[gameID].websockets is 0 and the game is not set to starting, if so, delete the game
        if(Object.keys(games[gameID].websockets).length == 0 && !games[gameID].starting){
            log.debug(`No clients left in game ${gameID}, deleting game`)
            delete games[gameID]
        }
    }
})


app.listen(3001, ()=>{
    log.info('Server is running on port 3001')
})
