import express from 'express'
import {Database} from 'bun:sqlite'
import type {clientType, gamesType, clientCard, card, cardMemoryObject} from '@/lib/types'
import {broadcastGameState, webserverInit, drawWhiteCard} from '@/api/lib'
import {WebSocket} from "ws";
import {Request} from "express";
import cors from 'cors'
import {Logger} from "@/lib/logger";
import replaceCard from "@/api/v2/routes/replaceCard";
import createGame from "@api/v2/routes/createGame";
import websocketHandler from "@api/v2/routes/websocketHandler";
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
//initialize the webserver
const {memoryCards, manifestIDs} = await webserverInit(log)

let games:gamesType = {}

//handle the discard of a card
app.delete('/v2/game/coordinator/:gameid/client/:userid/card/:cardid', async (req, res)=>{
    await replaceCard(req, res, games, memoryCards, log)
})

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

app.get('/v2/game/coordinator/:gameid/gamestate/:userid', (req, res)=>{
    if(!req.params.gameid || Array.isArray(req.params.gameid)){
        res.status(400).send('Game ID required')
        return
    }
    if(!req.params.userid || Array.isArray(req.params.userid)){
        res.status(400).send('User ID required')
        return
    }
    if(!games[req.params.gameid]){
        res.status(404).send('Game not found')
        return
    }
    if(!games[req.params.gameid].clients[req.params.userid]){
        res.status(404).send('User not found')
        return
    }
    //send the client the game state via the websocket
    res.status(200)
    games[req.params.gameid].websockets[req.params.userid].send(
        JSON.stringify(
            {
                type:'gameState',
                game:{
                    ownerID: games[req.params.gameid].ownerID,
                    allowedPacks: games[req.params.gameid].allowedPacks,
                    bannedIDs: games[req.params.gameid].bannedIDs,
                    started: games[req.params.gameid].started,
                    startedAt: games[req.params.gameid].startedAt,
                    currentBlackCard: games[req.params.gameid].currentBlackCard,
                    clients: games[req.params.gameid].clients
                }
            }
        )
    )
})

//create a new game with this endpoint
app.post('/v2/game/coordinator', async (req, res)=>{
    log.logRequest(req.url, 'POST')
    await createGame(games, req, res, log)
})


app.ws('/v2/game/coordinator/:gameID', async(ws:WebSocket, req:Request)=>{
    console.log('Websocket connection', req.url)
    console.log(games)
    await websocketHandler(ws, req, games, log)
})

app.listen(3001, ()=>{
    log.info('Server is running on port 3001')
})


/*
*     function getRandomBlackCard(gameID:string, game:gamesType):clientCard{
        function rand(){
            //get a random pack we should draw from
            let packID = Math.floor(Math.random() * games[gameID].allowedPacks.length)
            if(packID >= games[gameID].allowedPacks.length){
                packID = games[gameID].allowedPacks.length-1
            }
            const pack = games[gameID].allowedPacks[packID]
            const blackCardsPerPack = Object.keys(memoryCards[pack].black)
            if(blackCardsPerPack.length == 0){
                return {id: 'undefined', packID:'undefined'}
            }
            let cardIndex = Math.floor(Math.random() * memoryCards[pack].blackCount)
            if(cardIndex >= blackCardsPerPack.length) {
                cardIndex = blackCardsPerPack.length - 1
            }
            if(!blackCardsPerPack[cardIndex]){
                return {id: 'undefined', packID:'undefined'}
            }
            //get a random card from that pack
            const card = {
                id: blackCardsPerPack[cardIndex],
                packID: pack
            }
            return card
        }
        let card = rand()
        while(card.id == 'undefined'){
            card = rand()
        }
        return card
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
        const newCards = drawWhiteCard(gameID, newClient.userID, games, memoryCards)
        games[gameID].clients[newClient.userID].cards = newCards
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

                //this means we need to fill the black card as well as the cards.ts held by the clients
                //get a random black card
                games[gameID].currentBlackCard = getRandomBlackCard(gameID)
                //send a special startGame message to all clients
                for(const usrID of Object.keys(games[gameID].websockets)){
                    games[gameID].websockets[usrID].send(JSON.stringify({type:'startGame'}))
                }
            }

            //submit a card
            //TODO: Implement this

            //start the judging phase
            //TODO: Implement this

            //award points
            //TODO: Implement this

            //start the next round
            //TODO: Implement this
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
* */