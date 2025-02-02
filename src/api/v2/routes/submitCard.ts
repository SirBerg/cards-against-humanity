import {Request, Response} from 'express'
import {cardMemoryObject, clientCard, gamesType} from "@/lib/types";
import {Logger} from "@/lib/logger";

//Validate the basic request format of the submitCards endpoint (like if the gameID and userID are present)
function validateSubmitCards(request:Request, games:gamesType):boolean{
    if(!request.params.gameID || !request.query.userID){
        return false
    }
    if(!games[request.params.gameID] || !games[request.params.gameID].clients[request.query.userID as string]){
        return false
    }
    return !(!request.body.cards || !Array.isArray(request.body.cards));
}
export default function submitCards(request:Request, response:Response, games:gamesType, cards:cardMemoryObject, log:Logger){
    log.logRequest(request.url, 'POST')
    const isValid = validateSubmitCards(request, games)
    if(!isValid){
        response.status(400).json({error: 'Invalid request'})
        return
    }

    //Check if the submitted cards are more than the pick count
    if(request.body.cards.length > games[request.params.gameID].currentBlackCard.pickCount){
        response.status(400).json({error: 'Too many cards submitted'})
        return
    }

    //Check if the player has already submitted cards
    if(games[request.params.gameID].clients[request.query.userID as string].submittedCards.length > 0){
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
    games[request.params.gameID].clients[request.query.userID as string].submittedCards = request.body.cards
    response.status(200).json({message: 'Cards submitted'})
    return
}