import type {gamesType} from "@/lib/types";
import {Logger} from "@/lib/logger";

export function broadcastGameState(gameID:string, games:gamesType, log:Logger){
    //send the clients the game state
    for(const usrID of Object.keys(games[gameID].websockets)){
        const clientWS = games[gameID].websockets[usrID]
        log.debug(`Sending game state to client ${usrID}`)
        clientWS.send(
            JSON.stringify(
                {
                    type:'gameState',
                    game:{
                        ownerID: games[gameID].ownerID,
                        allowedPacks: games[gameID].allowedPacks,
                        bannedIDs: games[gameID].bannedIDs,
                        started: games[gameID].started,
                        startedAt: games[gameID].startedAt,
                        currentBlackCard: games[gameID].currentBlackCard,
                        clients: games[gameID].clients
                    }
                }
            )
        )
    }
}