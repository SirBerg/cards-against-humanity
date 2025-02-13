import {card, gameType} from "@/lib/types";

/*
* @description This component is used during the judging phase of the game to display content to players who are not the judge
* @returns {JSX.Element}
* @params
* - game: typeof gameType
* - cards: {[key:string]:card[]}
* - user: {id:string, name:string}
* - gameID: string
*/
export default function Player({game, cards, user, gameID}:{game:gameType, cards:{[key:string]:card[]}, user:{id:string, name:string}, gameID:string}){
    return(
        <div>
            Player
        </div>
    )
}