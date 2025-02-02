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
import submitCards from "@api/v2/routes/submitCard";
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
app.delete('/v2/game/coordinator/:gameID/client/:clientID/card/:cardID', async (req, res)=>{
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
    broadcastGameState(req.params.gameid, games, log)
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

//submit cards to the game
app.post('/v2/game/coordinator/:gameID/submit/:userID', async (req, res)=>{
    submitCards(req, res, games, memoryCards, log)
})

//create a new game with this endpoint
app.post('/v2/game/coordinator', async (req, res)=>{
    log.logRequest(req.url, 'POST')
    await createGame(games, req, res, log)
})


app.ws('/v2/game/coordinator/:gameID', async(ws:WebSocket, req:Request)=>{
    await websocketHandler(ws, req, games, memoryCards, manifestIDs, log)
})

app.listen(3001, ()=>{
    log.info('Server is running on port 3001')
})