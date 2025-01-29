import { Database } from 'bun:sqlite'
import { Request } from 'express'
export type gameTable = {
    id:string,
    ownerID:string,
    allowedPacks:string,
    allowedIDs:string,
    bannedIDs:string,
    started:boolean,
    startedAt:string,
    ended:boolean,
    allowBlackCardDupes:boolean,
    blackCardsPlayed:string
}
export type validMessageTypes = 'newUser' | 'removeUser' | 'startGame' | 'endGame' | 'banUser' | 'unbanUser' | 'whiteCardSubmitted' | 'blackCardDrawn' | 'winner'
export default async function coordinator(ws:WebSocket, req:Request, clients:Array<{userID:string, userName:string, ws:WebSocket, req:Request}>, userID:string){
    const db = new Database('data/main.sqlite3')

    const commands = {

    }

    //send all other clients a message with the user's name and ID
    clients.forEach((client)=>{
        client.ws.send(JSON.stringify({type:'newUser', userID:req.headers.userid, userName:req.headers.username}))
    })

    //handle incoming messages
    ws.on('message', (msg:string)=>{
        try{
            const message = JSON.parse(msg.toString())
            if(!message.type){
                console.log('Message has no type, ignoring')
                return
            }
        }
        catch(err){
            console.log('Could not parse JSON, ignoring message')
            return
        }

        clients.forEach((client)=>{
            //remove any stale connections from the list of clients
            if(client.ws.readyState !== WebSocket.OPEN){
                //remove the client from the list of clients
                clients = clients.filter((client)=>{
                    return client.userID !== req.headers.userid
                })
            }

            //send the message to all other clients
            client.ws.send(msg.toString())
        })
    })
    ws.on('close', ()=>{
        console.log('Connection closed')
        //remove the current client from the list of clients
        clients = clients.filter((client)=>{
            return client.userID !== req.headers.userid
        })
        console.log(clients.length)
        //send all other clients a message with the user's name and ID
        clients.forEach((client)=>{
            client.ws.send(JSON.stringify({type:'removeUser', userID:req.headers.userid}))
        })
    })
    ws.on('open', ()=>{
        console.log('Connection opened')
    })
    ws.on('error', (err:Error)=>{
        console.error(err)
    })
}