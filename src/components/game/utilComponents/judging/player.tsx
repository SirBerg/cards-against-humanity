import {card, gameType} from "@/lib/types";
import {WhiteCard} from "@/components/game/utilComponents/cards";

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
            {
                //Map over the cards of the focused user and display them
                game.judging.focusedPlayer && cards ? cards[game.judging.focusedPlayer].map((card:card)=>{
                   //Find the client card that matches the card id
                    const clientCard = game.clients[game.judging.focusedPlayer].submittedCards.find((clientCard)=>{
                          return clientCard.id === card.id
                    })
                    const cardToDisplay = {...card}
                    if(clientCard && !clientCard.isRevealed){
                        cardToDisplay.content = "Cards against humanity"
                    }

                    return <WhiteCard card={cardToDisplay} key={card.id} selected={false} />
                }): <div>Loading...</div>
            }
        </div>
    )
}