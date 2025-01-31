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
    useEffect(() => {
        console.log('USING BLACKCARD:', card)
    }, []);
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

export default function CardSelector({cards}:{cards:Array<card>}) {
    const [submittedCards, setSubmittedCards] = useState<Array<string>>([])
    return (
        <div className="cardSelector">
            {
                cards.map((card)=>{
                    return(
                        <Card selectedCards={submittedCards} card={card} key={card.id}/>
                    )
                })
            }
        </div>
    )
}