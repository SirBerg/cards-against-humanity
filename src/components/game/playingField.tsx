import {card, clientCardExtension, gameType} from "@/lib/types";
import {Logger} from "@/lib/logger";
import WhiteCardContainer from "@/components/game/utilComponents/playingFieldWhiteCardContainer";
import {BlackCard} from "@/components/game/utilComponents/cards";
import {useEffect, useReducer, useState} from "react";
import BlackCardContainer from "@/components/game/utilComponents/blackCardContainer";
import Judging from "@/components/game/utilComponents/judging";

//This component is responsible for rendering the playing phase of the game
//It takes three arguments:
/*
* game: typeof Game
* user: {id:string, name:string}
* gameID: string
* */
//This component also handles all of the playing functions such as submitting a card to the server
export default function PlayingField({game, user, gameID}:{game:gameType, user:{id:string, name:string}, gameID:string}){
    //State to store the dangling cards (so cards which have been clicked but not yet submitted by the user)
    const [danglingCards, setDanglingCards] = useState<card[]>([])
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const log = new Logger()
    log.setJsonLogging(false)
    log.setLogLevel('DEBUG')
    log.setProcessIsBrowser(true)
    log.info('PlayingField Mounted')

    //This function just calls the setDanglingCards function to update the dangling cards
    function updateDanglingCards(cards:card[]){
        log.debug('Updating Dangling Cards in parent component')

        //Somehow we have to use the destructuring syntax to update this state because react doesn't detect the change otherwise
        setDanglingCards([...cards])
    }

    useEffect(() => {
        log.warn('Game status changed in playing field!')
    }, [game]);
    useEffect(() => {
        log.warn('Dangling cards changed in playing field!')
        console.log(danglingCards)
    }, [danglingCards]);
    return(
        <div>
            {
                danglingCards ? <BlackCardContainer
                    card={game.currentBlackCard}
                    danglingCards={danglingCards}
                    submitted={game.clients[user.id].submittedCards.length > 0}
                    log={log}
                    game={game}
                    gameID={gameID}
                    user={user}
                /> : null
            }


            {
                game.status === 'judging' ?
                //If the game is in the judging phase, we need to show the judging component
                <Judging
                    game={game}
                    user={user}
                    gameID={gameID}
                    log={log}
                    updateDanglingCards={updateDanglingCards}
                /> : null
            }

            <WhiteCardContainer
                game={game}
                user={user}
                gameID={gameID}
                updateDanglingCards={updateDanglingCards}
                log={log}
            />
        </div>
    )
}