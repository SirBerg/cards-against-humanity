import { gamesType } from "@/lib/types";
import { Logger } from "@/lib/logger";
export function validateGameState(games:gamesType, gameID:string, log:Logger):boolean{
    let isValid = true
    const game = games[gameID]
    //Check if the game has at least 2 connected players
    if(game.queue.length < 2){
        log.debug('Not enough players in the game')
        isValid = false
    }

    //Check if there is at least 1 allowed pack
    if(game.allowedPacks.length < 1){
        log.debug('No packs in the game')
        isValid = false
    }

    return isValid
}