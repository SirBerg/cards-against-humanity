import {useEffect, useState} from "react";
import './cards.css'
import {card, clientCard, gameType} from "@/lib/types";
import {useCookies} from "next-client-cookies";
import {useSearchParams} from "next/navigation";
export function Card({selectedCards, card, game, enableCard}:{selectedCards:Array<card>, card:card, game:gameType, enableCard:Function}) {
    const cookies = useCookies()
    const [selected, setSelected] = useState(false)
    const searchParams = useSearchParams();
    const [isSubmitted, setSubmitted] = useState(selectedCards.filter((subCard)=>card.id == subCard.id).length > 0)
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
                            <div className={`whiteCard ${isSubmitted ? `cardIsSubmitted` : null}`}>
                                {card.content}
                                <div className="whiteCardPackName">
                                {card.packName}
                                </div>
                            </div>
                            {selected ?
                                (
                                    <div className="cardButtons">
                                        <button className="whiteCardSubmitButton" onClick={()=>{
                                            enableCard(card)
                                            setSubmitted(!isSubmitted)
                                        }}>
                                            {isSubmitted ? 'Take back' : 'Submit'}
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

export function BlackCard({cardInfos}:{cardInfos:{blackCard:card, playedCards:Array<card>}}) {
    const [cardContent, setCardContent] = useState('')
    useEffect(() => {
        console.log('Re-rendering black card')
        console.log(cardInfos)
        if(!cardInfos.blackCard){
            return
        }
        let content = cardInfos.blackCard.content
        for(const playedCard of cardInfos.playedCards){
            content = content.replace(/_+/, `<span class="insertedPhrase">${playedCard.content}</span>`)
        }
        setCardContent(content)
    }, [cardInfos]);

    return (
        <div className="blackCard-Container">
            <div className="blackCard" dangerouslySetInnerHTML={{__html: cardContent}}>

            </div>
            <button className="submitButton">
                Confirm
            </button>
        </div>
    )
}

export default function CardSelector({cards, callback, game}:{cards:Array<card>, callback:Function, game:gameType}) {
    const [submittedCards, setSubmittedCards] = useState<Array<card>>([])
    useEffect(() => {
        console.log('Submitted cards:', submittedCards)
        callback(submittedCards)
    }, [submittedCards]);
    const toggleCard = (card:card) =>{
        if(submittedCards.filter((submittedCard)=>submittedCard.id == card.id).length > 0){
            setSubmittedCards(submittedCards.filter((submittedCard)=>submittedCard.id != card.id))
        }else {
            setSubmittedCards([...submittedCards, card])
        }
    }
    return (
        <div className="cardSelector">
            {
                cards.map((card)=>{
                    return(
                        <Card selectedCards={submittedCards} card={card} key={card.id} game={game} enableCard={toggleCard}/>
                    )
                })
            }
        </div>
    )
}
