

import {card, gameType} from "@/lib/types";
import {Logger} from "@/lib/logger";
import {useEffect, useState, useReducer} from "react";
import {AnimatePresence, motion} from "motion/react";
import {WhiteCard} from "@/components/game/utilComponents/cards";
import './judging.css'
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
    useEffect(() => {
        log.debug('Judging Mounted')
        //Async wrapper for fetch
        async function wrapper(){
            //Iterate over all the clients and fetch their cards
            for(const userID of Object.keys(game.clients)){
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
                            let newCards = {...cards}
                            if(newCards[userID]){
                                newCards[userID].push(card)
                            }
                            else{
                                newCards[userID] = [card]
                            }
                            setCards((prev)=>newCards)
                        })
                        .catch((error) => log.error(`Error while fetching card: ${error}`));
                    console.log('Cards in mounting', cards)
                }
            }
        }
        wrapper()
    }, []);

    //Handle updates to the game state
    useEffect(() => {
        setFocusedUser(game.judging.focusedPlayer)
        log.debug('Game State Changed in Judging Component')
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

    //If the current user has the turn, then we need to render another component than the ones for the normal users
    if(game.clients[user.id].isTurn){

        //For the user that has the turn, we render all the cards in a component for them to click and scroll through
        //This allows the user to freely click and scroll through all the suggestions
        return (
            <div>
                {
                    //map over all the cards of the user that is currently focused
                    cards && game.judging.focusedPlayer ? game.clients[game.judging.focusedPlayer].submittedCards.map((card)=>{



                        return(
                            <div key={card.id}>
                                {
                                    //If this is **not** the first user, we render the previous button
                                    //As the first user in the queue is the user with the turn, we need this to be over 0
                                    game.queue.indexOf(game.judging.focusedPlayer) > 0 ?
                                        <button onClick={()=>{
                                            updateFocusedUser(game.queue[game.queue.indexOf(game.judging.focusedPlayer)-1])
                                        }}>Previous</button>
                                        :
                                        null
                                }
                                {
                                    //Render the cards of that user
                                    game.clients[game.judging.focusedPlayer].submittedCards.map((submittedCard)=>{
                                        const card = cards[game.judging.focusedPlayer].find((card)=>{
                                            return card.id === submittedCard.id
                                        })
                                        if(!card){
                                            log.debug(`Card not found for ${submittedCard.id}`)
                                            return null
                                        }
                                        const newCard = {...card}

                                        //If the card is not revealed, we show a placeholder
                                        if(!submittedCard.isRevealed){
                                            newCard.content = 'Cards against Humanity'
                                        }

                                        return(
                                            <button
                                                key={card.id}
                                                onClick={()=>{
                                                    reveal(game.judging.focusedPlayer, card.id)
                                                }}
                                            >
                                                <WhiteCard card={newCard} selected={false} />
                                            </button>
                                        )
                                    })
                                }
                                {
                                    //If this is **not** the last user, we render the next button
                                    game.queue.indexOf(game.judging.focusedPlayer) < game.queue.length-1 ?
                                        <button onClick={()=>{
                                            updateFocusedUser(game.queue[game.queue.indexOf(game.judging.focusedPlayer)+1])
                                        }}>Next</button>
                                        :
                                        null
                                }
                            </div>
                        )
                    })
                : 'Loading...'}

            </div>
        )
    }

    //For all other users, we render the normal judging component (which updates according to the moves of the user with the turn)
    return (
        <div>
            {
                //Show the cards of the focused player
                cards && cards[focusedUser] ?
                    <motion.div className="whiteCardsContainerJudging">
                        {
                            cards[focusedUser].map((card)=>{
                                const indexOfCard = game.clients[focusedUser].submittedCards.findIndex((submittedCard)=>{
                                    return submittedCard.id === card.id
                                })
                                const newCard = {...card}
                                if(!game.clients[focusedUser].submittedCards[indexOfCard].isRevealed){
                                    newCard.content = 'Cards against Humanity'
                                }

                                return (
                                    <WhiteCard card={newCard} key={card.id} selected={false}/>
                                )
                            })
                        }
                    </motion.div>
                    :
                    'Loading...'
            }
        </div>
    )
}