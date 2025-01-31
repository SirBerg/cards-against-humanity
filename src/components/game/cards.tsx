import {useEffect, useState} from "react";
import './cards.css'
export function Card({selectedCards, card}:{selectedCards:Array<string>, card:{id:string, text:string, pack:string}}) {
    const [selected, setSelected] = useState(false)
    return(
        <div className={`whiteCardContainer ${selected?`whiteCardContainerActive`:null}`} onClick={()=>{setSelected(!selected)}}>
            {
                card ?
                    (
                        <div>
                            <div className="whiteCard">
                                {card.text}
                                {card.pack}
                            </div>
                            {selected ?
                                (<button className="whiteCardSubmitButton">
                                    Play
                                </button>) : null}
                        </div>
                    ):
                <div className="whiteCard">
                    Loading Card...
                </div>
            }
        </div>

    )
}

export function BlackCard({card}:{card:{content:string, pack:string, id:string}}) {
    return (
        <div className="blackCard-Container">
            <div className="blackCard">
                {card.content}
            </div>
            <button className="submitButton">
                Confirm
            </button>
        </div>
    )
}

export default function CardSelector({cards, callback}:{cards:{[key:string]:{content:string, pack:string }}, callback:Function}) {
    const [submittedCards, setSubmittedCards] = useState<Array<string>>([])
    return (
        <div className="cardSelector">
            {
                Object.keys(cards).map((card)=>{
                    return(
                        <Card selectedCards={submittedCards} card={{id:card, text:cards[card].content, pack:cards[card].pack}} key={card}/>
                    )
                })
            }
        </div>
    )
}