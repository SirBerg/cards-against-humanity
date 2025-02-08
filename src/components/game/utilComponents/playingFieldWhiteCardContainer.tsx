
import {gameType, card} from "@/lib/types";
import {Logger} from "@/lib/logger";
import {WhiteCard} from "@/components/game/utilComponents/cards";
import {useEffect, useState} from "react";
import './whiteCardContainer.css'
import {AnimatePresence, motion} from "motion/react";
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

/*
This function takes the white cards provided by the game object and renders them to the playing field
It handles submitting the card (but not sending it to the server)
For the card submission, go to the BlackCardContainer component
* It takes the following arguments
* game: typeof Game
* user: {id:string, name:string}
* gameID: string
* updateDanglingCards: (cards:card[])=>void
* */
export default function WhiteCardContainer({game, user, updateDanglingCards, log}:{game:gameType, user:{id:string, name:string}, gameID:string, updateDanglingCards:(cards:card[])=>void, log:Logger}){
    const [cards, setCards] = useState<card[]>([])
    const [danglingCards, setDanglingCards] = useState<card[]>([])
    //The hook for the toast
    const {toast} = useToast()

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
                //@ts-ignore
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
            //Set the returned cards to the state
            log.info('Setting White Cards')
            setCards(whiteCards)
        })
    }, [game.clients, log, user.id]);

    //This function handles the click event on a white card
    //It updates the dangling cards and checks if the card was already clicked once before
    //If the card was clicked before, then we remove it from the list of dangling cards
    function handleWhiteCardClick(card:card){
        log.debug(`White Card Clicked: ${card.id}`)
        //Check if the card was already clicked
        const index = danglingCards.findIndex((danglingCard:card)=>{
            return danglingCard.id === card.id
        })
        //If the card was clicked, remove it
        if(index !== -1){
            log.debug(`Removing previously clicked card with ID: ${card.id}`)
            const newDanglingCards = [...danglingCards]
            newDanglingCards.splice(index, 1)
            setDanglingCards(newDanglingCards)

            //Call the callback function to update the dangling cards in the parent component
            updateDanglingCards(newDanglingCards)
        }
        //If the card wasn't clicked, add it
        else{

            //Check if the dangling cards array is already full (compare it to the black card pick count)
            if(danglingCards.length >= game.currentBlackCard.pickCount){
                log.debug('Too many cards selected, not updating the dangling cards')
                toast({'description': 'You have already selected the maximum number of cards. De-Select some to keep going', 'title': 'Error'})
                return
            }

            //Else we can just add the card to the array (but of course we have to perform state black magic to make this work)
            log.debug(`Adding card with ID: ${card.id}`)
            const newDanglingCards = [...danglingCards]
            newDanglingCards.push(card)
            setDanglingCards(newDanglingCards)

            //Call the callback function to update the dangling cards in the parent component
            updateDanglingCards(newDanglingCards)
        }
    }

    //If the game is in the judging phase, we don't render the white cards
    if(game.status == "judging"){
        return null
    }

    //If the user has the turn, we return a message
    if(game.clients[user.id].isTurn){
        //TODO: Style this message
        return <div>It&#39;s your turn, sit tight and wait for the others to submit something funny</div>
    }

    //If the user has already submitted cards, we return a message
    if(game.clients[user.id].submittedCards.length > 0){
        //TODO: Style this message
        return <div>You are done for this round!</div>
    }

    return(
        <motion.div className="whiteCardContainerPlayingField">
            <AnimatePresence>
                {
                    //Render the white cards
                    cards.map((card:card)=>{
                        log.debug(`Rendering card: ${card.id}`)
                        //We need a wrapper div to be able to listen to the clicks
                        return (
                            <motion.div key={card.id} onClick={()=>{handleWhiteCardClick(card)}}>
                                <WhiteCard card={card} key={card.id} selected={
                                    danglingCards.findIndex((danglingCard:card)=>{
                                        return danglingCard.id === card.id
                                    }) > -1
                                }/>
                            </motion.div>
                        )
                    })
                }
            </AnimatePresence>
            <Toaster />
        </motion.div>
    )
}
