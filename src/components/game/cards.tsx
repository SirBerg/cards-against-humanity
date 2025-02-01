import {useEffect, useState} from "react";
import './cards.css'
import {card} from "@/lib/types";
export function Card({selectedCards, card}:{selectedCards:Array<string>, card:card}) {
    const [selected, setSelected] = useState(false)
    return(
        <div className={`whiteCardContainer ${selected?`whiteCardContainerActive`:null}`} onClick={()=>{setSelected(!selected)}}>
            {
                card ?
                    (
                        <div>
                            <div className="whiteCard">
                                {card.content}
                                <div className="whiteCardPackName">
                                {card.packName}
                                </div>
                            </div>
                            {selected ?
                                (
                                    <div className="cardButtons">
                                        <button className="whiteCardSubmitButton">
                                            Play
                                        </button>
                                        <button className="whiteCardDiscardButton">
                                            Discard
                                        </button>
                                    </div>
                                ) : null}
                        </div>
                    ):
                <div className="whiteCard">
                    Loading Card...
                </div>
            }
        </div>

    )
}

export function BlackCard({card}:{card:card}) {
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

export default function CardSelector({cards, callback}:{cards:Array<card>, callback:Function}) {
    const [submittedCards, setSubmittedCards] = useState<Array<string>>([])
    return (
        <div className="cardSelector">
            {
                cards.map((card)=>{
                    console.log(cards[card])
                    return(
                        <Card selectedCards={submittedCards} card={card} key={card.id}/>
                    )
                })
            }
        </div>
    )
}
