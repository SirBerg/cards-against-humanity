'use client'
import './waitingRoom.css'
import {useEffect, useState} from "react";
import { useSearchParams } from "next/navigation";
import {uuidv7} from "@/utils/uuid";
import {adjectives, animals, colors, uniqueNamesGenerator} from "unique-names-generator";
import {useCookies} from "next-client-cookies";
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"


export default function Handler(){
    const searchParams = useSearchParams();
    const [user, setUser] = useState({id:'', name:''})
    const { toast } = useToast()
    const cookies = useCookies()
    const [webSocket, setWebSocket] = useState<WebSocket>()
    useEffect(() => {
        //get the game ID from the URL
        console.log(searchParams.get('gameID'))
        if(!searchParams.get('gameID')){
            window.location.href = '/'
        }
        //check if the user has a cookie set with their ID and name
        //if not, create them
        let user = cookies.get('userID')
        if(!user || user == 'undefined' || cookies.get('userName') == ''){
            console.log("No user ID found, generating a new one")
            const id = uuidv7()
            const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

            const randomName = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] }); // big_red_donkey
            user = id
            cookies.set('userID', id)
            cookies.set('userName', randomName)
        }
        console.log('User ID: ', user)
        const ws = new WebSocket(`ws://localhost:3001/v1/game/coordinator/${searchParams.get('gameID')}?userid=${user}&username=${cookies.get('userName')}`);
        ws.onopen = () => {
            console.log("Connected to the websocket server");
        };
        ws.onmessage = (event) => {
            console.log(event.data)
            if(!event.data || !JSON.parse(event.data)){
                return
            }
            let message = JSON.parse(event.data)
            if(message.type == 'banUser'){
                window.alert('You have been banned from this game, redirecting to homepage')
                window.location.href = '/'
            }
            if(message.type == 'error'){
                toast({description: message.text, title: 'Error:'})
            }
            if(message.type == 'startGame'){
                window.location.href = `/game?gameID=${searchParams.get('gameID')}`
            }
        };
        ws.onclose = ()=>{
            console.log('Connection to the websocket server closed')
            toast({description: 'Connection to the websocket server closed', title: 'Error:'})
        }
        setWebSocket(ws)
        setUser({id:user, name:cookies.get('userName')})

    }, []);
    useEffect(()=>{
        cookies.set('userName', user.name)
    }, [user])
    return(
        <div className="waitingRoomMain">
            <div className="waitingRoomInner">
                <h1>The Waiting Room</h1>
                <br />
                <p>Waiting for your Game to start. Change your Name below:</p>
                <input type="text" value={user.name} onChange={(e)=>{
                    setUser({id:user.id, name:e.target.value})
                    if(webSocket){
                        webSocket.send(JSON.stringify({type: 'updateUser', userID: user.id, userName: e.target.value}))
                    }
                }} />
            </div>
            <Toaster />
        </div>
    )
}