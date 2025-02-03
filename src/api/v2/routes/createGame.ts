import {Request, Response} from 'express';
import {card, clientType, gamesType} from "@/lib/types";
import {uuidv7} from "@/utils/uuid";
import {Logger} from "@/lib/logger";

export function validateCreateGameRequest(req:Request, res:Response, log:Logger):Promise<{error:string}>{
    return new Promise((resolve, reject)=>{
        const userid = req.headers.userid
        const username = req.headers.username

        //check if the headers are provided, if not, reject
        if(!userid || !username){
            log.debug(`userid or username not provided`)
            reject({error:'userid or username not provided'})
        }

        //resolve if everything is fine
        resolve({error:''})
    })
}

export default async function createGame(games:gamesType, req:Request, res:Response, log:Logger){
    log.logRequest(req.url, 'POST')

    //check if the request is valid
    let isErr = false
    await validateCreateGameRequest(req, res, log).catch((err:{error:string})=>{
        res.status(400).json(err)
        isErr = true
    })

    //if there is an error, return
    if(isErr){
        return
    }

    //create the game
    const gameID = uuidv7()
    const userID = req.headers.userid
    const username = req.headers.username
    //add the game to the games object

    //create a client object for the owner (the one who requested this)
    const client:clientType = {
        userID: userID as string,
        userName: username as string,
        cards: [],
        points: 0,
        isConnected: false,
        isTurn: false,
        submittedCards: [],
    }

    //create the game object
    games[gameID] = {
        ownerID: userID as string,
        allowedPacks: [] as string[],
        bannedIDs: [],
        started: false,
        startedAt: null,
        currentBlackCard: {} as card,
        starting: false,
        clients: {
            [userID as string]: client
        },
        websockets: {},
        requests: {},
        queue: [],
        status: "lobby"
    }
    res.status(200).json({gameID})
    return
}