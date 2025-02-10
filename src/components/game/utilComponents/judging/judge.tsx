import {card, gameType} from "@/lib/types";
import {WhiteCard} from "@/components/game/utilComponents/cards";
import {Logger} from "@/lib/logger";
export default function Judge({cards, game, user, gameID, log, judgeQueue, updateFocusedUser}:{ cards:{[key: string]: card[]} , game:gameType, user:{id:string, name:string}, gameID:string, log:Logger, judgeQueue:string[], updateFocusedUser:(userID:string)=>Promise<void>}){

    return(
        <div>
            {
                //Display a previous button if there is a user before this one
                judgeQueue.indexOf(game.judging.focusedPlayer) - 1 >= 0 ?
                    <button onClick={() =>{
                        async function wrapper() {
                            log.info('Next button clicked')
                            log.debug(`Setting focused user to: ${judgeQueue[judgeQueue.indexOf(game.judging.focusedPlayer) - 1]}`)
                            await updateFocusedUser(judgeQueue[judgeQueue.indexOf(game.judging.focusedPlayer) - 1])
                        }
                        wrapper()
                    }}>Previous</button> : null
            }
            {
                //Map over the selected users' cards and display them
                cards[game.judging.focusedPlayer].map((card, index) => {
                    return(
                        <WhiteCard
                            key={index}
                            card={card}
                            selected={false}
                        />
                    )
                })
            }
            {
                //Display the next button if there is one
                judgeQueue.indexOf(game.judging.focusedPlayer) + 1 < judgeQueue.length ?
                    <button onClick={() => {
                        async function wrapper() {
                            log.info('Next button clicked')
                            log.debug(`Setting focused user to: ${judgeQueue[judgeQueue.indexOf(game.judging.focusedPlayer) + 1]}`)
                            await updateFocusedUser(judgeQueue[judgeQueue.indexOf(game.judging.focusedPlayer) + 1])
                        }
                        wrapper()
                    }
                    }>Next</button> : null
            }
        </div>
    )
}