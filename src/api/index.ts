import express from 'express'
import {Database} from 'bun:sqlite'
import coordinator, {gameTable} from './v1/game/coordinator'
import {uuidv7} from "@/utils/uuid";
import cors from 'cors'
const app = express()
const db = new Database('data/main.sqlite3')
// eslint-disable-next-line @typescript-eslint/no-require-imports
var expressWs = require('express-ws')(app)
app.use(cors())
//get all the manifest IDs
const manifestIDs = db.query('SELECT id FROM manifest').all().map((row)=>row.id)

let clients:{[key:string]:Array<{userID:string, userName:string, ws:WebSocket, req:Request}>} = {}
app.ws('/v1/game/coordinator/:gameid', async (ws:WebSocket, req:Request)=>{
    console.log('Socket connected')
    if(!req.params.gameid || !req.query.userid || Array.isArray(req.query.userid)){
        console.log('Closing connection because of: Game ID and User ID required')
        ws.send(JSON.stringify({type:'error', text:'Game ID and User ID required'}))
        ws.close()
        return
    }

    //check if the game exists
    const game:gameTable = db.query('SELECT * FROM games WHERE id = ?').get(req.params.gameid)
    if(!game){
        console.log('Closing connection because of: Game not found')
        ws.send(JSON.stringify({type:'error', text:'Game not found'}))
        ws.close()
        return
    }

    //check if the user is in the banned list for this game
    const banned = JSON.parse(game.bannedIDs)
    if(banned.includes(req.query.userid)){
        console.log('Closing connection because of: User is banned')
        ws.send(JSON.stringify({type:'error', text:'You are banned from this game'}))
        ws.close()
        return
    }

    if(!clients[game.id]){
        clients[game.id] = []
    }
    if(clients[game.id].find((client)=>client.userID == req.query.userid)){
        //the user is already connected, terminate the old connection and replace it with the new one
        clients[game.id].forEach((client)=>{
            if(client.userID == req.query.userid){
                client.ws.close()
            }
        })
    }

    clients[game.id].push({userID:req.query.userid, userName:req.query.username, ws, req})

    //insert the userid into the database
    let newUserID = {userID:req.query.userid, userName:req.query.username, points: 0}
    let allowedIDs = JSON.parse(game.allowedIDs)
    if(game.allowedIDs.includes(JSON.stringify(newUserID))){
        console.log('User already in the game, not adding them again')
    }
    else{
        allowedIDs.push(newUserID)
        db.query('UPDATE games SET allowedIDs = ? WHERE id = ?').run(JSON.stringify(allowedIDs), game.id)
    }

    await coordinator(ws, req, clients[game.id], req.query.userid, manifestIDs)
})

app.get('/v1/game/coordinator', (req, res)=>{
    res.status(426).send('Upgrade to a websocket connection').setHeaders({
        //@ts-ignore testing testing
        'Upgrade': 'websocket',
        'Connection': 'Upgrade'
    })
})

app.post('/v1/game/coordinator', (req, res)=>{
    //create a new game in the games table and return the ID to the sender
    console.log(req.headers)
    if(!req.headers.userid || !req.headers.username || Array.isArray(req.headers.userid) || Array.isArray(req.headers.username) || req.headers.userid == 'undefined' || req.headers.username == 'undefined'){
        res.status(400).send('User ID and Name required')
        return
    }
    const gameID = uuidv7()
    console.log(`Creating game with ID: ${gameID} and user ID: ${req.headers.userid}`)
    db.query('DELETE FROM games WHERE ownerID = ?').run(req.headers.userid)
    db.query('INSERT INTO games (id, ownerID, allowedPacks, allowedIDs, started, startedAt, ended, allowBlackCardDupes, blackCardsPlayed, bannedIDs) VALUES (?, ?, ? ,?, ?, ?, ?, ?, ?, ?)')
        .run(gameID, req.headers.userid.replaceAll('"', ''), '[]', JSON.stringify([{userID: req.headers.userid.replaceAll('"', ''), userName: req.headers.username, points: 0}]), false, 'null', false, false, '[]', '[]')
    res.status(200).json({gameID})
})

app.listen(3001, ()=>{
    console.log('Server is running on port 3001')
})
