import {card, cardMemoryObject, clientCard, gamesType} from "@/lib/types";

export function drawWhiteCard(games:gamesType, gameID:string, memoryCards:cardMemoryObject):clientCard{
    //get a random pack we should draw from
    let packIndex = Math.floor(Math.random() * games[gameID].allowedPacks.length)
    if (packIndex >= games[gameID].allowedPacks.length) {
        packIndex = games[gameID].allowedPacks.length - 1
    }
    const pack = games[gameID].allowedPacks[packIndex]

    const cardsPerPack = Object.keys(memoryCards[pack].white)

    //make sure there are cards in this pack, else return immediately
    if (cardsPerPack.length == 0) {
        return {id: 'undefined', packID: 'undefined', isRevealed: false}
    }

    //get a random card from that pack
    let cardIndex = Math.floor(Math.random() * memoryCards[pack].whiteCount)
    if (cardIndex >= cardsPerPack.length) {
        cardIndex = cardsPerPack.length - 1
    }
    if (!cardsPerPack[cardIndex]) {
        return {id: 'undefined', packID: 'undefined', isRevealed: false}
    }
    return {
        id: cardsPerPack[cardIndex],
        packID: pack,
        isRevealed: false
    }
}
//This function just makes sure that we don't have to repeat the same code twice
export function getRandomWhiteCard(games:gamesType, gameID:string, memoryCards:cardMemoryObject):clientCard{
    let card = drawWhiteCard(games, gameID, memoryCards)
    while(card.id == 'undefined'){
        console.log('Undefined card, trying again')
        card = drawWhiteCard(games, gameID, memoryCards)
    }
    return card
}


export function drawBlackCard(games:gamesType, gameID:string, memoryCards:cardMemoryObject):card{
    //get a random pack we should draw from
    let packIndex = Math.floor(Math.random() * games[gameID].allowedPacks.length)
    if (packIndex >= games[gameID].allowedPacks.length) {
        packIndex = games[gameID].allowedPacks.length - 1
    }
    const pack = games[gameID].allowedPacks[packIndex]

    //make sure there are cards in this pack, else return immediately
    if (memoryCards[pack].blackCount == 0) {
        return {id: 'undefined', packID: 'undefined', content: 'undefined', pickCount: 0, packName: 'undefined', type: 'black'}
    }

    //get a random card from that pack
    let cardIndex = Math.floor(Math.random() * memoryCards[pack].blackCount)
    if (cardIndex >= Object.keys(memoryCards[pack].black).length) {
        cardIndex = Object.keys(memoryCards[pack].black).length - 1
    }

    const cardID = Object.keys(memoryCards[pack].black)[cardIndex]
    if (!memoryCards[pack].black[cardID]) {
        return {id: 'undefined', packID: 'undefined', content: 'undefined', pickCount: 0, packName: 'undefined', type: 'black'}
    }
    return {
        id: memoryCards[pack].black[cardID].id,
        packID: memoryCards[pack].black[cardID].packID,
        content: memoryCards[pack].black[cardID].content,
        pickCount: memoryCards[pack].black[cardID].pickCount,
        packName: memoryCards[pack].packName,
        type: 'black'
    }
}



//This function just makes sure that we don't have to repeat the same code twice
export function getRandomBlackCard(games:gamesType, gameID:string, memoryCards:cardMemoryObject):card{
    let card = drawBlackCard(games, gameID, memoryCards)
    while(card.id == 'undefined'){
        console.log('Undefined card, trying again')
        card = drawBlackCard(games, gameID, memoryCards)
    }
    return card
}
