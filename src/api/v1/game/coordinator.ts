import { Database } from 'bun:sqlite'
import { Request } from 'express'
export type gameTable = {
    id:string,
    ownerID:string,
    allowedPacks:string,
    allowedIDs:string,
    bannedIDs:string,
    started:boolean,
    startedAt:string,
    ended:boolean,
    allowBlackCardDupes:boolean,
    blackCardsPlayed:string
}
export type validMessageTypes = 'newUser' | 'removeUser' | 'startGame' | 'endGame' | 'banUser' | 'unbanUser' | 'updateUser' | 'whiteCardSubmitted' | 'blackCardDrawn' | 'winner' | 'drawWhiteCard' | 'updateDecks' | 'error' | 'getDecks' | 'updateReadyState'
export const messageTypes:Array<validMessageTypes> = [
    'newUser',
    'removeUser',
    'startGame',
    'endGame',
    'banUser',
    'unbanUser',
    'whiteCardSubmitted',
    'drawWhiteCard',
    'blackCardDrawn',
    'winner',
    'updateDecks',
    'error',
    'getDecks',
    'updateReadyState',
    'updateUser'
]
export default async function coordinator(ws:WebSocket, req:Request, clients:Array<{userID:string, userName:string, ws:WebSocket, req:Request}>, userID:string, manifestIDs:Array<string>){
    const db = new Database('data/main.sqlite3')
    //check if the user is the owner of the game
    let game = db.query('SELECT * FROM games WHERE id = ?').get(req.params.gameid)
    let isOwner = false
    let isStarted = game.started != '0'  //check if the game has started
    if(game.ownerID == req.query.userid){
        isOwner = true //the user is the owner of the game
    }
    //check the allowedDecks
    let allowedDecks:Array<string> = JSON.parse(game.allowedPacks)
    //send all other clients a message with the user's name and ID
    clients.forEach((client)=>{
        client.ws.send(JSON.stringify({type:'newUser', userID:req.query.userid, userName:req.query.username}))
    })
    //handle incoming messages
    ws.on('message', (msg:string)=>{
        let message
        try{
            message = JSON.parse(msg.toString())
            console.log(message.type)
            if(!message.type){
                console.log('Message has no type, ignoring')
                return
            }
            if(!messageTypes.includes(message.type)){
                console.log('Invalid message type, ignoring')
                return
            }
        }
        catch(e){
            console.log('Could not parse JSON, ignoring message')
            return
        }
        let returnMessage:any = {'type': 'error', 'text': 'Empty Message'}
        if(message.type == 'updateReadyState'){
            //check the current ready state of the game
            game = db.query('SELECT * FROM games WHERE id = ?').get(req.params.gameid)
            isStarted = game.started != '0'
            allowedDecks = JSON.parse(game.allowedPacks)
            returnMessage = {'type': 'updateReadyState', 'started': isStarted}
        }

        //start the game if the owner sends a startGame message
        if(message.type == 'startGame'){
            //check if the game has started
            if(isStarted){
                ws.send(JSON.stringify({'type': 'error', 'text': 'Game already started'}))
                return
            }
            else if(!isOwner){
                ws.send(JSON.stringify({'type': 'error', 'text': 'You are not the owner of this game'}))
                return
            }
            else if(clients.length < 2){
                returnMessage = {'type': 'error', 'text': 'Not enough players to start the game'}
            }
            else if(allowedDecks.length < 1){
                returnMessage = {'type': 'error', 'text': 'No decks added to the game'}
            }
            else{
                returnMessage = {'type': 'startGame', 'text': 'Game started!'}
                db.query('UPDATE games SET started = ?, startedAt = ? WHERE id = ?').run(true, Date.now(), req.params.gameid)
                isStarted = true
            }
        }
        //this is where logic is handled for private message for only one client
        if(message.type == 'drawWhiteCard' && isStarted){
        }

        //handle the logic to add or remove a deck from the game
        if(message.type == 'updateDecks'){
            //check if the request is coming from the owner of the game
            if(!isOwner){
                ws.send(JSON.stringify({'type': 'error', 'text': 'Your are not the owner of this game!'}))
                return
            }
            if(!message.deckIDs){
                ws.send(JSON.stringify({'type': 'error', 'text': 'Deck IDs required'}))
                return
            }
            if(!Array.isArray(message.deckIDs)){
                ws.send(JSON.stringify({'type': 'error', 'text': 'Deck IDs must be an Array'}))
                return
            }
            //add the deck to the list of allowed decks
            if(allowedDecks.includes(message.deckIDs)){
                ws.send(JSON.stringify({'type': 'error', 'text': 'Deck already added'}))
                return
            }
            allowedDecks = message.deckIDs

            db.query('UPDATE games SET allowedPacks = ? WHERE id = ?').run(JSON.stringify(allowedDecks), req.params.gameid)
            ws.send(JSON.stringify({'type': 'addDeck', 'deckID': message.deckID}))
            return
        }

        //handle the update user message
        if(message.type == 'updateUser'){
            console.log('Updating user')
            if(!message.userID || !message.userName){
                ws.send(JSON.stringify({'type': 'error', 'text': 'User ID and Name required'}))
                return
            }
            //check if the user is trying to update themself and not someone else
            if(message.userID != req.query.userid) {
                ws.send(JSON.stringify({'type': 'error', 'text': 'You can only update yourself'}))
                return
            }
            //send the updated user information to all other clients
            returnMessage = {'type': 'updateUser', 'userID': message.userID, 'userName': message.userName}
        }
        if(message.type == 'banUser'){
            if(!isOwner){
                ws.send(JSON.stringify({'type': 'error', 'text': 'You are not the owner of this game'}))
                return
            }
            //check if the user is trying to ban themself
            if(message.userID == req.query.userid){
                ws.send(JSON.stringify({'type': 'error', 'text': 'You cannot ban yourself'}))
                return
            }
            //ban the user from the game
            let banned = JSON.parse(game.bannedIDs)
            if(banned.includes(message.userID)){
                ws.send(JSON.stringify({'type': 'error', 'text': 'User already banned'}))
                return
            }
            banned.push(message.userID)
            db.query('UPDATE games SET bannedIDs = ? WHERE id = ?').run(JSON.stringify(banned), req.params.gameid)
            //send the banned user a message that they have been banned
            clients.forEach((client)=>{
                if(client.userID == message.userID){
                    //send the banned user a message that they have been banned
                    client.ws.send(JSON.stringify({'type': 'banUser', 'text': 'You have been banned from this game'}))
                    //close the connection
                    client.ws.close()
                }
            })
        }
        console.log('Returning Message: ', returnMessage)
        clients.forEach((client)=>{
            //remove any stale connections from the list of clients
            if(client.ws.readyState !== WebSocket.OPEN){
                //remove the client from the list of clients
                clients = clients.filter((client)=>{
                    return client.userID !== req.query.userid
                })
            }
            //send the message to all other clients
            client.ws.send(JSON.stringify(returnMessage))
        })
        return
    })

    ws.on('close', ()=>{
        console.log('Connection closed')
        //remove the current client from the list of clients
        clients = clients.filter((client)=>{
            return client.userID !== req.query.userid
        })
        console.log(clients.length)
        //send all other clients a message with the user's name and ID
        clients.forEach((client)=>{
            client.ws.send(JSON.stringify({type:'removeUser', userID:req.query.userid}))
        })
        if(clients.length == 0){
            console.log('No clients connected, closing the connection and deleting the game')
            db.query('DELETE FROM games WHERE id = ?').run(req.params.gameid)
        }
    })
    ws.on('open', ()=>{
        console.log('Connection opened')
    })
    ws.on('error', (err:Error)=>{
        console.error(err)
    })
}