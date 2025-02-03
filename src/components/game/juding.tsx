import {useState, useEffect} from "react";
import {gameType, card} from "@/lib/types";
import { type CarouselApi } from "@/components/ui/carousel"

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import './judging.css'
export default function Judging({game, userID, wsCallback}:{game:gameType, userID:string, wsCallback:(nextCardID:string, direction:"Forward" | "Backward")=>void}){
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
                    <CarouselItem className="carouselItem">1</CarouselItem>
                    <CarouselItem className="carouselItem">2</CarouselItem>
                    <CarouselItem className="carouselItem">3</CarouselItem>
                </CarouselContent>
                {game.clients[userID].isTurn ? <CarouselPrevious /> : null}
                {game.clients[userID].isTurn ? <CarouselNext /> : null}
            </Carousel>

        </div>
    )
}