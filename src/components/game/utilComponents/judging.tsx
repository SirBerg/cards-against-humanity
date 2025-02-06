

import {gameType} from "@/lib/types";
import {Logger} from "@/lib/logger";
//This component is responsible to handle the judging phase of the game
//It takes the following arguments:
//game: typeof gameType
//user: {id:string, name:string}
//gameID: string
//log: Logger
export default function Judging({game, user, gameID, log}:{game:gameType, user:{id:string, name:string}, gameID:string, log:Logger}){

    //If the current user has the turn, then we need to render another component than the ones for the normal users
    if(game.clients[user.id].isTurn){
        return (
            <div>
                <h1>It&#39;s your turn to judge!</h1>
            </div>
        )
    }


    return (
        <div>
            <h1>Judging</h1>
        </div>
    )
}