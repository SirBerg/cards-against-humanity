'use client'
import {useEffect, useState} from "react";
import {useCookies} from "next-client-cookies";
import {useSearchParams} from "next/navigation";
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import Scoreboard from "@/components/game/scoreboard";
import {uuidv7} from "@/utils/uuid";
import CardSelector, {BlackCard} from "@/components/game/cards";
import {gameType, card} from "@/lib/types";
import './game.css'
import Judging from "@/components/game/juding";
export default function Game(){
    const [websocket, setWebsocket] = useState<WebSocket>()
    const searchParams = useSearchParams();
    const [gameID, setGameID] = useState('')
    const cookies = useCookies()
    const { toast } = useToast()
    const [user, setUser] = useState({id:'', name:''})
    const [userCards, setUserCards] = useState<Array<card>>([])
    const [playedCards, setPlayedCards] = useState<Array<card>>([])
    const [submitted, setSubmitted] = useState(false)
    const [blackCardInfos, setBlackCardInfos] = useState<{blackCard:card, playedCards:Array<card>}>({blackCard:null, playedCards:[]})
    const [game, setGame] = useState<
        gameType | null
    >(null)
    useEffect(() => {
        //check if there's a cookie set with the id and name of the user
        //if there is, connect to the websocket server and request a new game
        //if there isn't, generate a new id and set it as a cookie
        let user = cookies.get('userID')
        if(!user || user == 'undefined' || cookies.get('userName') == ''){
            console.log("No user ID found, generating a new one")
            const id = uuidv7()
            const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');
            const randomName = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] }); // big_red_donkey
            user = id
            setUser({id:id, name:randomName})
            cookies.set('userID', id)
            cookies.set('userName', randomName)
        }
        console.log('User ID: ', user)
        //get the gameID from the URL
        const gameID = searchParams.get('gameID')
        if(!gameID){
            toast({description: 'There is not gameID in that URL', title: 'Error:'})
            window.location.href='/'
            return
        }
        setGameID(gameID)
    }, []);
    useEffect(() => {
        const ws = new WebSocket(`ws://localhost:3001/v2/game/coordinator/${gameID}?userid=${cookies.get('userID')}&username=${cookies.get('userName')}`)
        setWebsocket(ws)
        ws.onopen = () => {
            console.log('Connected to the websocket server')
            ws.send(JSON.stringify({type:'getGame'}))
        }
        ws.onmessage = (message) => {
            const data = JSON.parse(message.data)
            if(data.type == 'error'){
                toast({description: data.error, title: 'Error:'})
            }
            if(data.type == 'gameState'){
                setGame(data.game)
            }
        }
    }, [gameID]);

    useEffect(() => {
        console.log('USING GAMESTATE:', game)
        //set the state of the black card
        async function wrapper(){
            console.log('CURRENT BLACK CARD', game?.currentBlackCard)
            setBlackCardInfos({blackCard:await getCard(game?.currentBlackCard.id, game?.currentBlackCard.packID), playedCards:[]})

            //set the state of the user's cards
            let cards = []
            for(let card of game.clients[cookies.get('userID')].cards){
                cards.push(await getCard(card.id, card.packID))
            }
            console.log(cards)
            setUserCards(cards)
        }
        if(game){
            wrapper()
        }
    }, [game]);
    async function getCard(cardID:string, packID:string):Promise<card>{
        return new Promise(async (resolve, reject) => {
            const requestOptions = {
                method: "GET",
                redirect: "follow"
            };
            await fetch(`http://localhost:3001/v2/card/${packID}/${cardID}`, requestOptions)
                .then((response) => response.text())
                .then((result) => {
                    try{
                        const card = JSON.parse(result)
                        resolve(card)
                    }
                    catch(e){
                        console.error(e)
                        reject(e)
                    }
                })
                .catch((error) => reject(error));
        })

    }
    useEffect(()=>{
        if(game){
            console.log(game, game.clients[cookies.get('userID')].submittedCards.length, submitted)
        }
        if(submitted && game && game.clients[cookies.get('userID') as string].submittedCards.length == 0 && playedCards.length == 0){
            console.log('Submitting')
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            const raw = JSON.stringify({cards:blackCardInfos.playedCards.map((card)=>{return {id:card.id, packID:card.packID, isReveald: false}})});
            console.log(raw)
            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: raw,
                redirect: "follow"
            };

            fetch(`http://localhost:3001/v2/game/coordinator/${gameID}/submit/${cookies.get('userID')}`, requestOptions)
                .catch((error) => console.error(error));
        }
    },[submitted])
    useEffect(() => {
        console.log('State changed: ', playedCards)
    }, [playedCards]);
    useEffect(() => {
        console.log('Black Card state changed: ', blackCardInfos)
    }, [blackCardInfos]);


    //if the game isn't empty anymore, we want to show the game;
    if(game && game.status != 'judging'){
        console.log(cookies.get('userID'))
        //if it's the users turn, we want to show them the black card only and a message to wait for the other players
        if(game.clients[cookies.get('userID')].isTurn){
            return(
                <div className="gameMain">
                    <BlackCard cardInfos={blackCardInfos} submit={()=>{setSubmitted(true)}}/>
                    <div>
                        <h2>It&#39;s your turn! Sit tight and wait for the others to submit something</h2>
                    </div>
                    <Toaster />
                </div>
            )
        }

        //this is the default screen shown to the user
        return(
            <div className="gameMain">
                <BlackCard cardInfos={blackCardInfos} submit={()=>{setSubmitted(true)}}/>
                {userCards.length > 0 && !submitted ? <CardSelector cards={userCards} game={game} callback={(playedCards:Array<card>)=>{
                    const blackCardInfo = {blackCard:blackCardInfos.blackCard, playedCards:playedCards}
                    setBlackCardInfos(blackCardInfo)
                }}/> : 'You are done for this round, wait for the others to finish!'}
                <Toaster />
            </div>
        )
    }

    //if the game is in the judging phase, show the juding component as well as the BlackCard component
    else if(game && game.status == 'judging'){
        return(
            <div className="gameMain">
                <BlackCard cardInfos={blackCardInfos} submit={()=>{setSubmitted(true)}}/>
                <div>
                    <Judging game={game} userID={cookies.get('userID') as string} gameID={gameID} wsCallback={(wsPayload:object)=>{return}} />
                </div>
                <Toaster />
            </div>
        )
    }
    //if the game hasn't loaded yet, show a loading message
    else{
        return(
            <div className="gameMain">
                Loading Game...
                <Toaster />
            </div>
        )
    }
}