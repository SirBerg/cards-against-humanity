import {gamesType} from "@/lib/types";
import {Logger} from "@/lib/logger";
import {broadcastGameState} from "@api/lib";
export default function onClose(games:gamesType, gameID:string, playerID:string, log:Logger){
    //Delete the client from the game
    delete games[gameID].websockets[playerID]

    //We set the client as disconnected but still keep the scores for an eventual reconnect
    //But we have to check that the client is still in the clients object as banned clients are removed by the server and we have no way of checking if this disconnection is from a ban or a natural one
    if(games[gameID].clients[playerID]){
        games[gameID].clients[playerID].isConnected = false
    }

    //remove them from the queue if they are in it
    if(games[gameID].queue.includes(playerID)){
        games[gameID].queue = games[gameID].queue.filter((id:string)=>id != playerID)
    }

    //Set their turn to false if it's their turn
    if(games[gameID].clients[playerID].isTurn){
        games[gameID].clients[playerID].isTurn = false

        //update the turn to the next user in the queue
        if(games[gameID].queue.length > 0){
            games[gameID].clients[games[gameID].queue[0]].isTurn = true
        }
    }

    //Check if there are now no players in the game and if so, delete the game if it's not set to "starting"
    if(games[gameID].queue.length === 0 && !games[gameID].starting){
        delete games[gameID]
        return
    }

    //Broadcast the game state
    broadcastGameState(gameID, games, log)
}