import { Request } from 'express';
import { Logger } from '@/lib/logger';
import { WebSocket } from 'ws';
import {gamesType} from "@/lib/types";
import {broadcastGameState} from "@api/lib";

//Check if everything required from the client is present (i.e. the game ID and the player ID)
async function checkPreRequisites(req:Request, log:Logger):Promise<string>{
    return new Promise((resolve, reject)=>{
        if(!req.params.gameID || !req.query.playerID || !req.query.userName){
            log.debug('Missing gameID, playerID or userName in query')
            reject('Missing gameID, playerID or userName in query')
        } else {
            resolve('')
        }
    })
}

export default async function runPreflight(req:Request, ws:WebSocket, games:gamesType, log:Logger){
    return new Promise(async (resolve, reject)=>{
        let isError = false

        await checkPreRequisites(req, log).catch((e)=>{
            log.debug(`Client failed preflight checks: ${e}`)
            isError = true
        })
        if(isError){
            reject('Client failed preflight checks')
            return
        }

        //Check if the game exists
        if(!games[req.params.gameID as string]){
            log.debug(`Game does not exist ${req.params.gameID}`)
            reject('Game does not exist')
            return
        }
        log.debug(`Websocket connection received: ${req.query.playerID}, with userid: ${req.query.userName}, to game: ${req.params.gameID}`)
        //Check if the player is banned
        if(games[req.params.gameID as string].bannedIDs.includes(req.query.playerID)){
            log.debug(`Player is banned ${req.query.playerID}`)
            reject('Player is banned')
            return
        }
        //Check if the player is already connected, if they are, close that connection and send a message
        if(games[req.params.gameID as string].clients[req.query.playerID as string] && games[req.params.gameID as string].clients[req.query.playerID as string].isConnected){
            log.debug(`Player is already connected ${req.query.playerID}`)
            //send a message to the player
            games[req.params.gameID as string].websockets[req.query.playerID as string].send(JSON.stringify({'type':'newConnection'}))

            //close the connection
            games[req.params.gameID as string].websockets[req.query.playerID as string].close(1008, JSON.stringify({'error': 'New connection opened'}))
        }

        //Check if the player exists (if they are not in the game, then add them)
        if(!games[req.params.gameID as string].clients[req.query.playerID as string]){
            games[req.params.gameID as string].clients[req.query.playerID as string] = {
                userID: req.query.playerID as string,
                userName: req.query.userName as string,
                cards: [],
                points: 0,
                isConnected: true,
                isTurn: false,
                submittedCards: []
            }
        }

        //set the websocket for the player
        games[req.params.gameID as string].websockets[req.query.playerID as string] = ws

        //set the request for the player
        games[req.params.gameID as string].requests[req.query.playerID as string] = req

        //set the player as connected
        games[req.params.gameID as string].clients[req.query.playerID as string].isConnected = true

        //broadcast the new connection to all players
        broadcastGameState(req.params.gameID, games, log)
        resolve('')
    })
}