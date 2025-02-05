import {clientCardExtension, gameType} from "@/lib/types";
import {Logger} from "@/lib/logger";
import WhiteCardContainer from "@/components/game/playingFieldWhiteCardContainer";

//This component is responsible for rendering the playing phase of the game
//It takes three arguments:
/*
* game: typeof Game
* user: {id:string, name:string}
* gameID: string
* */
//This component also handles all of the playing functions such as submitting a card to the server
export default function PlayingField({game, user, gameID}:{game:gameType, user:{id:string, name:string}, gameID:string}){
    const log = new Logger()
    log.setJsonLogging(false)
    log.setLogLevel('DEBUG')
    log.setProcessIsBrowser(true)
    log.info('PlayingField Mounted')
    function updateDanglingCards(cards:clientCardExtension[]){
        log.debug('Updating Dangling Cards')
    }
    return(
        <div>
            <h1>{game.currentBlackCard.content}</h1>
            <WhiteCardContainer game={game}
                                user={user}
                                gameID={gameID}
                                updateDanglingCards={updateDanglingCards}
                                log={log}/>
        </div>
    )
}