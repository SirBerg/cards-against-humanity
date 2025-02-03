import {Request} from 'express'
import {Logger} from "@/lib/logger";
import {WebSocket} from 'ws'
import runPreflight from "@api/v2/routes/websocket/preflight";
import {cardMemoryObject, gamesType} from "@/lib/types";
import onMessage from "@api/v2/routes/websocket/message";
import onClose from "@api/v2/routes/websocket/close";
export default async function websocketHandler(ws:WebSocket, req:Request, games:gamesType, cards:cardMemoryObject, packManifest:packManifest, log:Logger){
    log.logRequest(req.url, 'WS')
    let failedPreflight = false
    //execute the preflight checks to ensure the connection is valid etc
    await runPreflight(req, ws, games, log, cards).catch(()=>{
        log.error('Error running preflight checks')
        failedPreflight = true
    })
    //if the preflight checks failed, close the connection and return out of the function
    if(failedPreflight){
        ws.close(1008, JSON.stringify({'error': 'Error running preflight checks'}))
        return
    }

    //if the preflight checks passed, we can then add the event listeners and set some variables
    const gameID = req.params.gameID as string
    const playerID = req.query.userid as string
    const userName = req.query.username as string

    ws.on('message', (message)=>{
        log.debug(`Received message from client ${playerID}: ${message}`)
        onMessage(message, games, gameID, playerID, cards, packManifest, log)
    })

    //when the connection is closed, log it
    ws.onclose = ()=>{
        log.debug(`Connection closed for ${playerID}`)
        onClose(games, gameID, playerID, log)
    }
}