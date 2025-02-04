import {gamesType} from "@/lib/types";
import {Logger} from "@/lib/logger";
import {Request, Response} from 'express'
import {broadcastGameState} from "@api/lib";
function validateRevealCardRequest(req:Request, log:Logger):boolean{

    if(!req.params.gameID || !req.params.userID || !req.params.cardID){
        log.debug('cardID, userID oder gameID missing')
        return false
    }

    return true;
}

export default function revealCard(games:gamesType, req:Request, res:Response, log:Logger){
    const isValid = validateRevealCardRequest(req, log)
    if(!isValid){
        res.status(400).json({"error":"Invalid Request Type for reveal card request"})
        return
    }

    const gameID = req.params.gameID as string;
    const userID = req.params.userID as string;
    const cardID = req.params.cardID as string;

    //Check if the game exists
    if(!games[gameID]){
        log.debug('No game matches gameID')
        res.status(404).json({"error":"Game doesn't exist"})
    }

    //Check if the user exists in that game
    if(!games[gameID].clients[userID]){
        log.debug(`User is not in clients for gameID ${gameID}`)
        res.status(404).json({"error":"User not found"})
    }

    //Check if the card is in the submitted array
    if(!games[gameID].clients[userID]){
        log.debug(`Card is not in submitted array for user ${userID}`)
        res.status(404).json({"error":"card not found"})
    }

    //Set the card to be revealed
    let index = 0;
    for(const card of games[gameID].clients[userID].submittedCards){
        if(card.id == cardID){
            games[gameID].clients[userID].submittedCards[index].isRevealed = true;
            break;
        }
        index++;
    }
    res.status(200)
    broadcastGameState(gameID, games, log)
    return
}