

import {card, gameType} from "@/lib/types";
import {Logger} from "@/lib/logger";
import {useEffect, useState, useReducer} from "react";
import './judging.css'
import Judge from "@/components/game/utilComponents/judging/judge";
import Player from "@/components/game/utilComponents/judging/player";
//This component is responsible to handle the judging phase of the game
//It takes the following arguments:
//game: typeof gameType
//user: {id:string, name:string}
//gameID: string
//log: Logger
export default function Judging({game, user, gameID, log, updateDanglingCards}:{game:gameType, user:{id:string, name:string}, gameID:string, log:Logger, updateDanglingCards:(cards:card[])=>void}){
    const [focusedUser, setFocusedUser] = useState<string>(game.judging.focusedPlayer)
    const [cards, setCards] = useState<{[key:string]:card[]}>(null)
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const [judgeQueue, setJudgeQueue] = useState<string[]>(game.queue.filter((clientID) => !game.clients[clientID].isTurn))
    useEffect(() => {
        log.debug('Judging Mounted')
        //Async wrapper for fetch
        async function wrapper(){
            //Iterate over all the clients and fetch their cards
            let newCards:{[key:string]:card[]} = {}
            for(const userID of Object.keys(game.clients)){
                log.info(`Fetching cards for ${userID}`)
                for(const submittedCard of game.clients[userID].submittedCards){
                    const requestOptions = {
                        method: "GET",
                        redirect: "follow"
                    };
                    //Actually fetch the cards
                    await fetch(`http://localhost:3001/v2/card/${submittedCard.packID}/${submittedCard.id}`, requestOptions)
                        .then((response) => response.text())
                        .then((result) => {
                            const card:card = JSON.parse(result)
                            log.debug(`Fetched card: ${card.id}`)
                            if(newCards[userID]){
                                newCards[userID].push(card)
                            }
                            else{
                                newCards[userID] = [card]
                            }
                        })
                        .catch((error) => log.error(`Error while fetching card: ${error}`));
                    console.log('Cards in mounting', cards)
                }

                //Set the focused user to the first user in the judge queue if this user is the judge
                if(game.clients[user.id].isTurn){
                    await updateFocusedUser(judgeQueue[0])
                }
            }
            log.error('Setting cards')
            setCards(newCards)
        }
        wrapper()
    }, []);

    //Handle updates to the game state
    useEffect(() => {
        setFocusedUser(game.judging.focusedPlayer)
        log.debug('Game State Changed in Judging Component')

        //Update the judge queue
        setJudgeQueue(game.queue.filter((clientID) => {
            if(game.clients[clientID].isTurn){
                return false
            }
            return game.clients[clientID].submittedCards.length !== 0;

        }))

    }, [game]);
    useEffect(() => {
        log.info('Cards have been updated in judging component')
        if(cards){
            console.log(cards)
        }
        else{
            log.warn('Cards is empty')
        }

    }, [cards]);
    useEffect(()=>{
        log.debug('Judge Queue Updated')
        console.log(judgeQueue)
    }, [judgeQueue])
    //Once the focusedPlayer updates, we need to update the dangling cards in the parent component to show the correct cards to the user
    useEffect(() => {

        log.debug('Focused player changed')
        //Set the dangling cards to the cards of the focused player
        if(cards && cards[focusedUser]){
            updateDanglingCards(cards[focusedUser])
        }
        else{
            log.warn(`No cards found for user ${focusedUser}`)
        }
    }, [focusedUser, game, cards]);

    //Reveals a card in the API
    async function reveal(clientID:string, cardID:string){
        const requestOptions = {
            method: "PATCH",
            redirect: "follow"
        }
        await fetch(`http://localhost:3001/v2/game/coordinator/${gameID}/reveal/${clientID}/${cardID}`, requestOptions)
            .then((response) => response.text())
            .then((result) => {
                log.debug(`Revealed card: ${cardID}`)
                console.log(result)
            })
            .catch((error) => log.error(`Error while revealing card: ${error}`));
    }
    async function updateFocusedUser(userID:string){
        const requestOptions = {
            method: "PATCH",
            redirect: "follow"
        }
        await fetch(`http://localhost:3001/v2/game/coordinator/${gameID}/gamestate/${userID}/focus`, requestOptions)
            .then((response) => response.text())
            .then((result) => {
                log.debug(`Updated focused user: ${userID}`)
                console.log(result)
            })
            .catch((error) => log.error(`Error while updating focused user: ${error}`));
    }

    //Check if the game and cards are loaded, if not then we return the loading screen
    console.log('Game in judging', game)
    console.log('Cards in judging', cards)

    if(!game || !cards){
        log.warn('Game or cards not loaded')
        return <div>{user.id}</div>
    }

    //If the user is the judge, we show the judge view
    if(game.clients[user.id].isTurn){
        return <Judge cards={cards} game={game} user={user} gameID={gameID} log={log} judgeQueue={judgeQueue} updateFocusedUser={updateFocusedUser} revealCard={reveal}/>
    }

    //If this user is not the judge, we show only the Player Component
    return <Player game={game} cards={cards} user={user} gameID={gameID} />
}