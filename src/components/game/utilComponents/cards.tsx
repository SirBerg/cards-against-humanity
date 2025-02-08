//This file has the raw cards for the game
//These cards take one argument of type card and return a JSX element
//They do NOT handle any of the logic behind the game, this must be delegated to another component
//This ensures that they are reusable and can be used in other situations
import {card} from '@/lib/types'
import './cards.css'
import {motion} from 'motion/react'
export function WhiteCard({card, selected}:{card:card, selected:boolean}){
    return(
        <motion.div className={`whiteCard ${selected ? 'whiteCardSelected' : ''}`}
            exit={{opacity: 0, y: -50}}
            initial={{opacity: 0, y: 50}}
            animate={{opacity: 1, y: 0}}
        >
            <p>{card.content}</p>
        </motion.div>
    )
}

export function BlackCard({card}:{card:card}){
    //We use dangerouslySetInnerHTML to render the HTML content of the card (since it contains HTML injected by the parent component)
    return(
        <div className="blackCard" dangerouslySetInnerHTML={{__html: card.content}} />
    )
}