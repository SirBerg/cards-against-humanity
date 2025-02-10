import {gamesType} from "@/lib/types";
import {Request, Response} from "express";
import {Logger} from "@/lib/logger";
import {broadcastGameState} from "@api/lib";

async function checkFocusedUserReq(req:Request, res:Response):Promise<void>{
    return new Promise((resolve, reject)=>{
        if(!req.params.gameID || Array.isArray(req.params.gameID)){
            res.status(400).json({error: 'Game ID required'})
            reject()
        }
        if(!req.params.userID || Array.isArray(req.params.userID)){
            res.status(400).json({error: 'User ID required'})
            reject()
        }
        resolve()
    })
}

export default async function updateFocusedUser(req:Request, res:Response, games:gamesType, log:Logger){
    let isErr = false
    log.debug('Received request to update focused user')
    await checkFocusedUserReq(req, res).catch(()=>isErr=true)
    if(isErr){
        log.warn('Invalid request to updateFocusedUser')
        return
    }

    //Check if this game exists
    if(!games[req.params.gameID]){
        res.status(404).json({error: 'Game not found'})
        return
    }

    //Check if that user exist in the game
    if(!games[req.params.gameID].clients[req.params.userID]){
        res.status(404).json({error: 'User not found'})
        return
    }

    //Update the focused user
    games[req.params.gameID].judging.focusedPlayer = req.params.userID
    console.log(games[req.params.gameID].judging.focusedPlayer)
    log.debug(`Updated focused user to ${req.params.userID}`)
    broadcastGameState(req.params.gameID, games, log)
    res.status(204).send();
    return
}