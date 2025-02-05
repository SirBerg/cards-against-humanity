'use client'
//This the game Page. It does not do anything else but keep the states of the game. Everything else is delegated to components
import {useEffect, useState} from "react";
import {useCookies} from "next-client-cookies";
import {uuidv7} from "@/utils/uuid";
import {adjectives, animals, colors, uniqueNamesGenerator} from "unique-names-generator";
import {gameType} from "@/lib/types";
import {useSearchParams} from 'next/navigation'
import {Logger} from "@/lib/logger";
import PlayingField from "@/components/game/playingField";
export default function Page(){
    const cookies = useCookies()
    const log = new Logger()
    log.setJsonLogging(false)
    log.setLogLevel('DEBUG')
    log.setProcessIsBrowser(true)

    //States
    //State to store the current user information in
    const [user, setUser] = useState({id:'', name:''})
    //State to store the game ID
    const [gameID, setGameID] = useState('')
    //State to store the websocket connection
    const [ws, setWs] = useState<WebSocket>()
    //State to store the game information
    const [game, setGame] = useState<gameType | null>(null)

    //This hook allows us to read the query parameters from the URL
    const searchParams = useSearchParams()
    //Open a websocket connection to the server
    useEffect(()=>{
        log.debug('Page Mounted, checking User Data and Game ID')
        let userID = cookies.get('userID')
        let userName = cookies.get('userName')

        //Generate a new User ID for a newly joining user while the game is in progress
        if(!userID){
            userID = uuidv7()
            cookies.set('userID', userID)
        }
        if(!userName){
            userName = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] })
            cookies.set('userName', userName)
        }

        //Set the user ID and user name in the state
        setUser({id:userID, name:userName})
        log.info(`Using User ID: ${userID}, User Name: ${userName}`)
        const gameID = searchParams.get('gameID')
        if(!gameID){
            log.error('No game ID found in the URL')
            return
        }
        log.info(`Setting Game ID to ${gameID}`)
        setGameID(gameID)
    }, [])

    //This hook is called when the component has received a valid gameID and connects to the server
    useEffect(() => {
        //open a websocket connection to the server and store the connection in the state
        const websocket = new WebSocket(`ws://localhost:3001/v2/game/coordinator/${gameID}?userid=${user.id}&username=${user.name}`)
        setWs(websocket)
        websocket.onerror = (e) => {
            log.error('Error while connecting to the websocket server')
        }
        websocket.onopen = () => {
            log.info('Connected to the websocket server')
        }
        websocket.onmessage = (event:Event) =>{
            log.debug('Received Websocket message from the server')
            let data
            try{
                data = JSON.parse(event.data.toString())
                if(!data){
                    return
                }
            }
            catch(e){
                console.log('Error while parsing JSON: ', e)
            }
            log.debug('Data Received:')
            //Process the data received from the server
            if(data.type == 'gameState'){
                log.debug('Type of message is game')
                setGame(()=>data.game)
            }
        }
    }, [gameID]);
    useEffect(() => {
        log.debug('Game State Updated:')
        console.log(game)
    }, [game]);
    return(
        <div>
            {
                game ? <PlayingField game={game} gameID={gameID} user={user} /> : <div>Loading...</div>
            }
        </div>
    )
}