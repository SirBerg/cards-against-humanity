import {clientCard, gamesType} from "@/lib/types";

//this function takes a gameID and a userID and updates their cards in such a way that they at most have 5 cards
export function drawWhiteCard(gameID:string, userID:string, games:gamesType, memoryCards:any, replaceCard?:string):Array<clientCard> {
    function getRandomWhiteCard(): clientCard {
        //get a random pack we should draw from
        let packIndex = Math.floor(Math.random() * games[gameID].allowedPacks.length)
        if (packIndex >= games[gameID].allowedPacks.length) {
            packIndex = games[gameID].allowedPacks.length - 1
        }
        const pack = games[gameID].allowedPacks[packIndex]

        const cardsPerPack = Object.keys(memoryCards[pack].white)

        //make sure there are cards in this pack, else return immediately
        if (cardsPerPack.length == 0) {
            return {id: 'undefined', packID: 'undefined'}
        }

        //get a random card from that pack
        let cardIndex = Math.floor(Math.random() * memoryCards[pack].whiteCount)
        if (cardIndex >= cardsPerPack.length) {
            cardIndex = cardsPerPack.length - 1
        }
        if (!cardsPerPack[cardIndex]) {
            return {id: 'undefined', packID: 'undefined'}
        }
        const card = {
            id: cardsPerPack[cardIndex],
            packID: pack
        }
        return card
    }
    let returnCards:Array<clientCard> = games[gameID].clients[userID].cards

    //check if the user has 5 cards already or greater
    if (returnCards.length >= 5 && !replaceCard) {
        //remove the cards that are to much
        while(returnCards.length > 5){
            returnCards.pop()
        }
        //return out of the function
        return returnCards
    }

    //check if we should replace a card
    if(replaceCard && replaceCard != ''){
        //find the card we should replace
        let cardIndex = returnCards.findIndex((card)=>{
            return card.id == replaceCard
        })
        //if we found the card, replace it
        if(cardIndex != -1){
            returnCards[cardIndex] = getRandomWhiteCard()
        }
        return returnCards
    }

    //draw as many cards as we can without going over the limit
    while (returnCards.length < 5) {
        let card = getRandomWhiteCard()

        //make sure we don't add a card that is undefined
        while(card.id == 'undefined'){
            card = getRandomWhiteCard()
        }
        returnCards.push(getRandomWhiteCard())
    }
    return returnCards
}
