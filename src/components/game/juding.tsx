import {useState, useEffect} from "react";
import {gameType, card, clientCard} from "@/lib/types";
import { type CarouselApi } from "@/components/ui/carousel"

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import './judging.css'
import {WhiteCardWithoutUtils, HiddenCard} from "@/components/game/cards";
export default function Judging({game, userID, gameID, wsCallback}:{game:gameType, userID:string, gameID:string, wsCallback:(wsPayload:object)=>void}){
    const [currentCard, setCurrentCard] = useState<card>(null)
    const [api, setApi] = useState<CarouselApi>()
    const [count, setCount] = useState(0)
    const [current, setCurrent] = useState(0)
    useEffect(()=>{
        if(!api){
            return
        }
        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap() + 1)
        api.on("select", () => {
            console.log(api.selectedScrollSnap())
            setCurrent(api.selectedScrollSnap() + 1)
        })
    }, [api])
    return (
        <div className="judgingContainer">
            <Carousel className="judgingCarousel" setApi={setApi}>
                <CarouselContent>
                    {
                        Object.keys(game.clients).map((userID:string, index:number)=>{
                            const cards = game.clients[userID].submittedCards
                            return cards.map((card:clientCard)=>{
                                return (
                                    <CarouselItem className="carouselItem" key={card.id} onClick={()=>{
                                        console.log('Revealing Card', game.clients[userID].isTurn, game, userID)
                                    if(game.clients[userID].isTurn && !card.isRevealed){

                                        const reqOptions = {
                                            method: "PATCH"
                                        }
                                        fetch(`http://localhost:3001/v2/game/coordinator/${gameID}/reveal/${userID}/${card.id}`, reqOptions).catch((err)=>console.log(err))
                                    }
                                }}>{
                                    card.isRevealed ? <WhiteCardWithoutUtils card={card} />: <HiddenCard />
                                }</CarouselItem>)
                            })
                        })
                    }
                </CarouselContent>
                {game.clients[userID].isTurn ? <CarouselPrevious /> : null}
                {game.clients[userID].isTurn ? <CarouselNext /> : null}
            </Carousel>

        </div>
    )
}