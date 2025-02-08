import {card, gameType} from "@/lib/types";
import {Logger} from "@/lib/logger";
import WhiteCardContainer from "@/components/game/utilComponents/playingFieldWhiteCardContainer";
import {useEffect, useMemo, useState} from "react";
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

    const log = useMemo(() => new Logger(), [])
    log.setJsonLogging(false)
    log.setLogLevel('DEBUG')
    log.setProcessIsBrowser(true)
    log.info('PlayingField Mounted')

    //This function just calls the setDanglingCards function to update the dangling cards
    function updateDanglingCards(cards:card[]){
        log.debug('Updating Dangling Cards in parent component')
        setDanglingCards(cards)
    }

    useEffect(() => {
        log.warn('Game status changed in playing field!')
    }, [game, log]);

    return(
        <div>
            <BlackCardContainer
                card={game.currentBlackCard}
                danglingCards={danglingCards}
                submitted={game.clients[user.id].submittedCards.length > 0}
                log={log}
                game={game}
                gameID={gameID}
                user={user}
            />

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
