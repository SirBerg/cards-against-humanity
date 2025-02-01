import {useEffect, useState} from "react";
import './cards.css'
import {card, gameType} from "@/lib/types";
import {useCookies} from "next-client-cookies";
import {useSearchParams} from "next/navigation";
export function Card({selectedCards, card, game}:{selectedCards:Array<string>, card:card, game:gameType}) {
    const cookies = useCookies()
    const [selected, setSelected] = useState(false)
    const searchParams = useSearchParams();
    function discardCard(){
        console.log('Discarding card', card.id)
        const requestOptions = {
            method: "DELETE",
            redirect: "follow"
        };

        fetch(`http://localhost:3001/v2/game/coordinator/${searchParams.get('gameID')}/client/${cookies.get('userID')}/card/${card.id}`, requestOptions)
            .then((response) => {
                if(response.status == 404){
                    //if this throws an error AND is 404 then the client has gotten out of sync and needs to request an updated gamestate
                    console.error(response)
                    console.log('Requesting updated gamestate')
                    const fetchResult = fetch(`http://localhost:3001/v2/game/coordinator/${searchParams.get('gameID')}/gamestate/${cookies.get('userID')}`)
                }
                return response.text()
            })
            .then((result) => {
                console.log(result)
            })
            .catch((error) => console.error(error));
    }
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
                                        <button className="whiteCardDiscardButton" onClick={()=>discardCard()}>
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

export default function CardSelector({cards, callback, game}:{cards:Array<card>, callback:Function, game:gameType}) {
    const [submittedCards, setSubmittedCards] = useState<Array<string>>([])
    return (
        <div className="cardSelector">
            {
                cards.map((card)=>{
                    console.log(cards[card])
                    return(
                        <Card selectedCards={submittedCards} card={card} key={card.id} game={game}/>
                    )
                })
            }
        </div>
    )
}
