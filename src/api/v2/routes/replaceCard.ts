import { Request, Response} from 'express'
import {cardMemoryObject, clientCard, gamesType} from "@/lib/types";
import {Logger} from "@/lib/logger";
import {broadcastGameState} from "@api/lib/broadcast";
import {getRandomWhiteCard} from "@api/lib/cards";

function validateCardRequest(req:Request, res:Response, cardsInMemory:cardMemoryObject, games:gamesType, log:Logger):Promise<{error:string}>{
    return new Promise((resolve, reject)=>{
        const cardID = req.params.cardID
        const gameID = req.params.gameID
        const clientID = req.params.clientID
        //validate the request
        if(!cardID || !gameID || !clientID){
            log.debug(`cardID, gameID or clientID not provided`)
            reject({error:'cardID, gameID or clientID not provided'})
        }

        if(!games[gameID] || !games[gameID].clients[clientID]){
             reject({error:'Game or client does not exist'})
        }

        //check if the card exists (in the hand of the client)
        if(!games[gameID].clients[clientID].cards.filter((card)=>card.id === cardID).length){
            log.debug(`Card ${cardID} does not exist in the hand of client ${clientID}`)
            reject({error:'Card does not exist in the hand of the client'})
        }

        //if all of this has passed, resolve the promise
        resolve({error:''})
    })
}

export default async function replaceCard(req:Request, res:Response, games:gamesType, cardsInMemory:cardMemoryObject, log:Logger):Promise<void>{
    log.logRequest(req.url, 'DELETE')
    let isErr = false
    await validateCardRequest(req, res, cardsInMemory, games, log).catch((err:{error:string})=>{
        res.status(400).json(err)
        isErr = true
    })
    if(isErr){
        return
    }
    //here, we can assume that everything exists
    const cardID = req.params.cardID
    const gameID = req.params.gameID
    const clientID = req.params.clientID

    //replace the card
    //get a random card
    const card:clientCard = getRandomWhiteCard(games, gameID, cardsInMemory)

    //find the card in the hand of the client
    const cardIndex = games[gameID].clients[clientID].cards.findIndex((card)=>card.id === cardID)
    //replace the card
    games[gameID].clients[clientID].cards[cardIndex] = card

    //broadcast the game state
    broadcastGameState(gameID, games, log)

    res.status(200).send({success:true})
    return
}