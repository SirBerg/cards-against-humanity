import {card, gameType} from '@/lib/types'
import {motion} from 'motion/react'
import {BlackCard} from "@/components/game/utilComponents/cards";
import {useEffect, useState} from "react";
import {Logger} from "@/lib/logger";
/*
* This component provides the logic for the black card
* It handles updating the preview of the black card and the submission of the card
* It takes these arguments:
* card: card - The black card to be displayed
* danglingCards: card[] - The cards that have been clicked by the user
* */
export default function BlackCardContainer({card, danglingCards, submitted, game, user, gameID, log}:{card:card, danglingCards:Array<card>, submitted:boolean, game:gameType, user:{id:string, name:string}, gameID:string, log:Logger}){
    const [blackCard, setBlackCard] = useState<card>(card)

    //This hook updates the black card when the danglingCards updates
    //It replaces all the blanks in the black card with the white card's content
    useEffect(() => {
        log.info('Re-Rendering Black Card')
        //We need to wrap the effect in a function to be able to use async/await for the fetches
        async function effectWrapper(){
            const newBlackCard = {...card}
            const danglingCardsNew = [...danglingCards]
            //This function handles the case where the user has submitted cards to the game and the dangling cards array is empty (happens when the user refreshes mid-game and has already submitted cards)
            async function wrapper(){

                //if the user has submitted cards to the game and the dangling cards array is empty, we need to iterate over the submitted cards and fetch the card content from the server
                for(const submittedCard of game.clients[user.id].submittedCards){
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
                            danglingCardsNew.push(card)
                        })
                        .catch((error) => log.error(`Error while fetching card: ${error}`));
                }
            }

            //Check if we need to fetch the cards first, this does NOT need to be done if the game is in judging phase as we expect the judging component to update the dangling cards responsibly
            if(danglingCards.length === 0 && submitted && game.status != 'judging'){
                await wrapper()
            }
            for(const danglingCard of danglingCardsNew){

                //Find the submitted card in the user's submitted cards so we can check whether we should show the blank card replacement
                let submittedCard = null
                if(game.status == "judging" && game.judging.focusedPlayer){
                    submittedCard = game.clients[game.judging.focusedPlayer].submittedCards.find((clientCardExtension) => clientCardExtension.id === danglingCard.id)
                }


                //We check if this card is supposed to be revealed or not, if it's not supposed to be reveald and the game is in the judging phase we show a replacement text
                let newContent = danglingCard.content
                if(submittedCard && !submittedCard.isRevealed && game.status === 'judging'){
                    newContent = '______'
                }

                //We check if the user has submitted cards already to show them either a grayed out version to emphasize that they haven't submitted the card yet
                //or a version that is more visible to show that they have submitted the card
                if(submitted || game.status === 'judging' ){
                    newBlackCard.content = newBlackCard.content.replace(/_+/, `<span class="blankReplacement">${newContent}</span>`)
                }
                else{
                    newBlackCard.content = newBlackCard.content.replace(/_+/, `<span class="blankReplacementInactive">${newContent}</span>`)
                }
            }
            setBlackCard(newBlackCard)
        }
        effectWrapper()
    }, [danglingCards, submitted]);

    //This function is called when the user clicks the submit button
    //It just sends the cards to the server
    async function submit(){
        log.info('Submitting Cards')

        //Check if the danglingCards array is exactly the same length as the pickCount of the black card
        if(danglingCards.length !== blackCard.pickCount){
            log.error('Dangling Cards length does not match the pick count of the black card')
            return
        }

        //Send the cards to the server
        //This is done via a POST request to the server
        await fetch(`http://localhost:3001/v2/game/coordinator/${gameID}/submit/${user.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cards: danglingCards.map((card)=>{
                    return {id: card.id, packID: card.packID}
                })
            })
        })
        .then((result)=>result.text())
        .then((result)=>{console.log(result)})
        .catch((error)=>{
            log.error('Error submitting cards')
            console.log(error)
        })
    }
    return(
        <motion.div>
            <BlackCard card={blackCard} />
            {
                //if the user has not yet submitted cards to the game we can show them the submit button, otherwise we don't
                game.clients[user.id].submittedCards.length == 0 && !game.clients[user.id].isTurn && game.status != 'judging' ?
                    <button className="blackCardSubmitButton" onClick={() => submit()}>Submit this</button>
                    :
                    null
            }

        </motion.div>
    )
}