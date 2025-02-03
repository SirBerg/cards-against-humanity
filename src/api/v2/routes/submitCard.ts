import {Request, Response} from 'express'
import {cardMemoryObject, gamesType} from "@/lib/types";
import {Logger} from "@/lib/logger";
import {broadcastGameState} from "@api/lib";

//Validate the basic request format of the submitCards endpoint (like if the gameID and userID are present)
function validateSubmitCards(request:Request, games:gamesType, log:Logger):boolean{
    if(!request.params.gameID || !request.params.userID){
        log.debug('Missing gameID or userID')
        return false
    }
    if(!games[request.params.gameID] || !games[request.params.gameID].clients[request.params.userID as string]){
        log.debug('Game or client not found')
        return false
    }
    if(!request.body.cards || !Array.isArray(request.body.cards)){
        log.debug('Missing cards array')
        return false
    }
    return true;
}
export default function submitCards(request:Request, response:Response, games:gamesType, cards:cardMemoryObject, log:Logger){
    log.logRequest(request.url, 'POST')

    const isValid = validateSubmitCards(request, games, log)
    log.debug(`Valid request: ${isValid}`)
    if(!isValid){
        response.status(400).json({error: 'Invalid request'})
        return
    }
    log.debug(`Client ${request.query.userID} is submitting cards to game ${request.params.gameID}`)
    //Check if the submitted cards are more than the pick count
    if(request.body.cards.length > games[request.params.gameID].currentBlackCard.pickCount){
        response.status(400).json({error: 'Too many cards submitted'})
        return
    }

    //Check if the player has already submitted cards
    if(games[request.params.gameID].clients[request.params.userID as string].submittedCards.length > 0){
        response.status(400).json({error: 'You have already submitted cards'})
        return
    }

    //Check if the cards are real and in the right format
    for(const card of request.body.cards){
        //Check if the card is in the right format
        if(!card.id || !card.packID){
            response.status(400).json({error: 'Invalid card format'})
            return
        }

        //Check if the card is in the memory object
        if(!cards[card.packID].white[card.id]){
            response.status(400).json({error: 'Card not found'})
            return
        }
    }

    //Set the submitted cards for the player
    games[request.params.gameID].clients[request.params.userID as string].submittedCards = request.body.cards

    response.status(200).json({message: 'Cards submitted'})

    //Check if all players have submitted cards
    let allSubmitted = true
    for(const client in games[request.params.gameID].clients){
        if(!games[request.params.gameID].clients[client].submittedCards && games[request.params.gameID].clients[client].isConnected && !games[request.params.gameID].clients[client].isTurn){
            allSubmitted = false
            break
        }
    }

    //If all players have submitted cards, set the game state to judging
    if(allSubmitted){
        log.debug('All players have submitted cards, starting judging phase')
        //set the game state to judging
        games[request.params.gameID].status = 'judging'
    }

    //Broadcast the game state
    broadcastGameState(request.params.gameID, games, log)
    return
}