import {card, gameType} from "@/lib/types";
import {WhiteCard} from "@/components/game/utilComponents/cards";
import {Logger} from "@/lib/logger";
import '../judging.css'
export default function Judge({cards, game, user, gameID, log, judgeQueue, updateFocusedUser, revealCard}:{ cards:{[key: string]: card[]} , game:gameType, user:{id:string, name:string}, gameID:string, log:Logger, judgeQueue:string[], updateFocusedUser:(userID:string)=>Promise<void>, revealCard:(clientID:string, cardID:string)=>void}){

    return(
        <div className="judgeContainerPackage">
            {
                //Display a previous button if there is a user before this one

                    <button onClick={() =>{
                        async function wrapper() {
                            log.info('Next button clicked')
                            log.debug(`Setting focused user to: ${judgeQueue[judgeQueue.indexOf(game.judging.focusedPlayer) - 1]}`)
                            await updateFocusedUser(judgeQueue[judgeQueue.indexOf(game.judging.focusedPlayer) - 1])
                        }
                        wrapper()
                    }} className={`toggleButtonsJudge ${judgeQueue.indexOf(game.judging.focusedPlayer) - 1 >= 0  ? null : "btn-disabled-judge"}`} style={{marginRight: "10px"}} disabled = {judgeQueue.indexOf(game.judging.focusedPlayer) - 1 >= 0 ? false : true}>Previous</button>
            }
            {
                <div className="whiteCardJudgeSelector">
                    {
                        //Map over the selected users' cards and display them
                        cards[game.judging.focusedPlayer].map((card) => {

                            //Create a copy of the card to avoid mutating the original
                            const cardToDisplay = {... card};

                            //Get the client card from the game object as it contains the isRevealed property
                            const clientCard =
                                game.clients[game.judging.focusedPlayer].submittedCards[
                                    game.clients[game.judging.focusedPlayer].submittedCards.findIndex((clientCardExtension) => clientCardExtension.id === card.id)
                                    ]

                            //Check if the card should be displayed or not
                            if(!clientCard.isRevealed){
                                //Display a placeholder card if the card is not revealed
                                cardToDisplay.content = "Cards against humanity"
                            }

                            return(
                                <button key={card.id}
                                        onClick={()=>revealCard(game.judging.focusedPlayer, card.id)}
                                >
                                    <WhiteCard
                                        card={cardToDisplay}
                                        selected={false}
                                    />
                                </button>
                            )
                        })
                    }
                    <button className="judgeChooseButton">Choose this</button>
                </div>

            }
            {
                //Display the next button if there is one
                    <button onClick={() => {
                        async function wrapper() {
                            log.info('Next button clicked')
                            log.debug(`Setting focused user to: ${judgeQueue[judgeQueue.indexOf(game.judging.focusedPlayer) + 1]}`)
                            await updateFocusedUser(judgeQueue[judgeQueue.indexOf(game.judging.focusedPlayer) + 1])
                        }
                        wrapper()
                    }
                    } className={`toggleButtonsJudge ${judgeQueue.indexOf(game.judging.focusedPlayer) + 1 < judgeQueue.length ? null : "btn-disabled-judge"}`} style={{marginLeft: "10px"}} disabled={judgeQueue.indexOf(game.judging.focusedPlayer) + 1 < judgeQueue.length ? false : true}>Next</button>
            }
        </div>
    )
}