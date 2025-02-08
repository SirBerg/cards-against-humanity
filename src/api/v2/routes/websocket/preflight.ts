import { Request } from 'express';
import { Logger } from '@/lib/logger';
import { WebSocket } from 'ws';
import {cardMemoryObject, clientCard, gamesType} from "@/lib/types";
import {broadcastGameState} from "@api/lib";
import {getRandomWhiteCard} from "@api/lib/cards";

//Check if everything required from the client is present (i.e. the game ID and the player ID)
async function checkPreRequisites(req:Request, log:Logger):Promise<string>{
    return new Promise((resolve, reject)=>{
        if(!req.params.gameID || !req.query.userid || !req.query.username){
            log.debug('Missing gameID, playerID or userName in query')
            reject('Missing gameID, playerID or userName in query')
        } else {
            resolve('')
        }
    })
}

//This function checks the validity of a client on connection of a websocket
export default async function runPreflight(req:Request, ws:WebSocket, games:gamesType, log:Logger, memoryCards: cardMemoryObject){
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
        log.debug(`Websocket connection received: ${req.query.userid}, with userid: ${req.query.userName}, to game: ${req.params.gameID}`)
        //Check if the player is banned
        if(games[req.params.gameID as string].bannedIDs.includes(req.query.userid as string)){
            log.debug(`Player is banned ${req.query.userid}`)
            reject('Player is banned')
            return
        }

        //Check if the player exists (if they are not in the game, then add them)
        console.log(req.params, games)
        if(!games[req.params.gameID as string].clients[req.query.userid as string]){
            games[req.params.gameID as string].clients[req.query.userid as string] = {
                userID: req.query.userid as string,
                userName: req.query.username as string,
                cards: [],
                points: 0,
                isConnected: true,
                isTurn: false,
                submittedCards: []
            }
        }
        
        //Check if the player is already connected, if they are, close that connection and send a message
        if(games[req.params.gameID as string].clients[req.query.userid as string] && games[req.params.gameID as string].clients[req.query.userid as string].isConnected){
            log.debug(`Player is already connected ${req.query.userid}`)
            //send a message to the player
            games[req.params.gameID as string].websockets[req.query.userid as string].send(JSON.stringify({'type':'newConnection'}))

            //close the connection
            games[req.params.gameID as string].websockets[req.query.userid as string].close(1008, JSON.stringify({'error': 'New connection opened'}))
        }

        //set the websocket for the player
        games[req.params.gameID as string].websockets[req.query.userid as string] = ws

        //set the request for the player
        games[req.params.gameID as string].requests[req.query.userid as string] = req

        //set the player as connected
        games[req.params.gameID as string].clients[req.query.userid as string].isConnected = true

        //add them to the queue (if they are not already in it)
        if(!games[req.params.gameID as string].queue.includes(req.query.userid as string)){
            games[req.params.gameID as string].queue.push(req.query.userid as string)
        }

        //if they are the first in the queue set them as isTurn
        if(games[req.params.gameID as string].queue[0] === req.query.userid){
            games[req.params.gameID as string].clients[req.query.userid as string].isTurn = true
        }


        //if this game is set to started, then we need to fill the player's hand (if it is not already filled by some miracle)
        if(games[req.params.gameID as string].started) {
            //fill the player's hand
            while(games[req.params.gameID as string].clients[req.query.userid as string].cards.length < 5){
                //get a random card from the allowed packs
                const card:clientCard = getRandomWhiteCard(games, req.params.gameID as string, memoryCards)
                games[req.params.gameID as string].clients[req.query.userid as string].cards.push(card)
            }

            //also set the starting variable to false as the game should no longer be protected from deletion
            games[req.params.gameID as string].starting = false
        }

        //broadcast the new connection to all players
        broadcastGameState(req.params.gameID, games, log)

        resolve('')
    })
}
