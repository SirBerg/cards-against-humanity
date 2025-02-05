
import {clientCardExtension, gameType, card} from "@/lib/types";
import {Logger} from "@/lib/logger";
import {WhiteCard} from "@/components/game/cards";
import {useEffect, useState} from "react";
import './whiteCardContainer.css'

/*
This function takes the white cards provided by the game object and renders them to the playing field
It handles submitting the card (but not sending it to the server)
For the card submission, go to the BlackCardContainer component
* It takes the following arguments
* game: typeof Game
* user: {id:string, name:string}
* gameID: string
* updateDanglingCards: (cards:clientCardExtension[])=>void
* */
export default function WhiteCardContainer({game, user, gameID, updateDanglingCards, log}:{game:gameType, user:{id:string, name:string}, gameID:string, updateDanglingCards:(cards:clientCardExtension[])=>void, log:Logger}){
    const [cards, setCards] = useState<card[]>([])

    //This fetches the white cards from the server
    useEffect(() => {
        const whiteCards:card[] = []

        //We need this to be async because fetch isn't fast enough in some cases so we need to await the responses
        async function wrapper(){

            //Iterate over the cards this client has
            for(const card of game.clients[user.id].cards){
                const requestOptions = {
                    method: "GET",
                    redirect: "follow"
                };

                //Actually fetch the cards
                await fetch(`http://localhost:3001/v2/card/${card.packID}/${card.id}`, requestOptions)
                    .then((response) => response.text())
                    .then((result) => {
                        const card:card = JSON.parse(result)
                        log.debug(`Fetched card: ${card.id}`)
                        whiteCards.push(card)
                    })
                    .catch((error) => log.error(`Error while fetching card: ${error}`));
            }
        }
        wrapper().then(()=>{
            log.info('Setting White Cards')
            setCards(whiteCards)
        })
    }, []);
    return(
        <div className="whiteCardContainerPlayingField">
            {
                cards.map((card:card)=>{
                    return <WhiteCard card={card} key={card.id}/>
                })
            }
        </div>
    )
}