//This file has the raw cards for the game
//These cards take one argument of type card and return a JSX element
//They do NOT handle any of the logic behind the game, this must be delegated to another component
//This ensures that they are reusable and can be used in other situations
import {card} from '@/lib/types'
import './cards.css'

export function WhiteCard({card}:{card:card}){
    return(
        <div className="whiteCard">
            <p>{card.content}</p>
        </div>
    )
}