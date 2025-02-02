import {Logger} from "@/lib/logger";
import {gamesType} from "@/lib/types";
import {broadcastGameState} from "@api/lib";

const allowedCommands:string[] = [
    "updateUser",
    "banUser",
    "updateUser",
    "startGame"
]

export default function onMessage(event:any, games:gamesType, gameID:string, userID:string, log:Logger){
    //Check if the event data is a JSON object
    try{
        if (typeof event.data === "string") {
            event = JSON.parse(event.data)
        }
    }
    catch(e){
        log.debug(`Invalid JSON: ${event}, error was: ${e}`)
        return
    }

    //Check if the event has a type field
    //The Type field is the command that the client is sending
    if(!event.type){
        log.debug('No type in event')
        return
    }

    //Check if the command is allowed
    if(!allowedCommands.includes(event.type)){
        log.debug(`Invalid command: ${event.type}`)
        return
    }

    //Handle the command
    //Just broadcast the game state if the commands is 'getGame'
    if(event.type == 'getGame'){
        broadcastGameState(gameID, games, log)
        return
    }

    //Update the user
    if(event.type == 'updateUser' && event.userName){

        //We can assume that the user is already in the game, as they have already passed the preflight checks
        games[gameID].clients[userID].userName = event.userName

        //Broadcast the game state for every client to get the new userName
        broadcastGameState(gameID, games, log)
        return
    }

    //Ban user
    if(event.type == 'udpateUser' && games[gameID].ownerID == userID && event.userID){
        log.debug(`Banning user: ${event.userID}`)
        games[gameID].bannedIDs.push(event.userID as never)

        //if they are connected, send a message to them informing them that they are banned
        if(games[gameID].websockets[event.userID]){
            games[gameID].websockets[event.userID].send(JSON.stringify({'type':'banUser'}))
            games[gameID].websockets[event.userID].close(1008, JSON.stringify({'error': 'You have been banned'}))
        }

        //Remove the user from the game
        delete games[gameID].clients[event.userID]
        delete games[gameID].websockets[event.userID]

        //We do not need to broadcast the game state, as the server will fire the broadcastGameState function when the websocket closes
    }

    //Start game
    if(event.type == 'startGame' && games[gameID].ownerID == userID){
        log.debug('Starting game')
        games[gameID].starting = true

        //Broadcast the game state
        broadcastGameState(gameID, games, log)
    }
}