import {cardMemoryObject, clientCard, gamesType} from "@/lib/types";

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
    return {
        id: cardsPerPack[cardIndex],
        packID: pack
    }
}