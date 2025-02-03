import {Logger} from "@/lib/logger";
import {cardMemoryObject, gamesType, packManifest} from "@/lib/types";
import {broadcastGameState} from "@api/lib";
import {validateGameState} from "@api/lib/game";
import {getRandomBlackCard} from "@api/lib/cards";
import {RawData} from "ws";

const allowedCommands:string[] = [
    "updateUser",
    "banUser",
    "updateUser",
    "startGame"
]

export default function onMessage(eventInput:RawData, games:gamesType, gameID:string, userID:string, memoryCards:cardMemoryObject, packManifests:packManifest, log:Logger){
    //Check if the event data is a JSON object
    let event:{
        type: string,
        userName: string,
        userID: string
    }
    try{
        event = JSON.parse(eventInput.toString())
    }
    catch(e){
        log.debug(`Invalid JSON: ${eventInput}, error was: ${e}`)
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

        //Validate the Game state (like checking if there are enough players etc.)
        const isValid = validateGameState(games, gameID, log)
        if(!isValid){
            log.debug('Game state is invalid, not starting game')
            return
        }

        games[gameID].starting = true
        games[gameID].started = true
        games[gameID].startedAt = new Date().getTime().toString()
        games[gameID].status = 'playing'
        //Get a random black card
        games[gameID].currentBlackCard = getRandomBlackCard(games, gameID, memoryCards)

        //Broadcast the special startGame message to all clients
        for(const client of Object.keys(games[gameID].websockets)){
            games[gameID].websockets[client].send(JSON.stringify({'type':'startGame'}))
        }
    }

    //Handle Game Specific Tasks such as revealing Cards
    //Cards have to be submitted by calling the /v2/game/coordinator/:gameID/submit/:userID (POST) Endpoint
    //Winner has to be selected by calling the /v2/game/coordinator/:gameID/winner/:userID (POST) Endpoint

}