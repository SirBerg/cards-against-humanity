import {gamesType} from "@/lib/types";
import {Request, Response} from 'express'
import {Logger} from "@/lib/logger";
export function validateRequest(req:Request, res:Response, game:gamesType, log:Logger):Promise<void>{
    return new Promise((resolve)=>{
        const gameID = req.params.gameID
        const clientID = req.params.clientID
        if(!gameID || !clientID){
            log.debug(`gameID or clientID not provided`)
            res.status(400).send({error:'gameID or clientID not provided'})
        }
        if(!game[gameID]){
            log.debug(`Game ${gameID} does not exist`)
            res.status(404).send({error:'Game does not exist'})
        }
        if(!game[gameID].clients[clientID]){
            log.debug(`Client ${clientID} does not exist in game ${gameID}`)
            res.status(404).send({error:'Client does not exist in game'})
        }
        resolve()
    })
}