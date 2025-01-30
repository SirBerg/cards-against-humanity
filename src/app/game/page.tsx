'use client'
import {useEffect, useState} from "react";
import {useCookies} from "next-client-cookies";
import {useSearchParams} from "next/navigation";
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import Scoreboard from "@/components/game/scoreboard";
import {uuidv7} from "@/utils/uuid";
import CardSelector from "@/components/game/cards";
export default function Game(){
    const [game, setGame] = useState({
        gameID:'',
        users:{},
        ownerID:'',
        ownerName:'',
        started: true,
        allowedPacks:[],
    })
    const [websocket, setWebsocket] = useState<WebSocket>()
    const searchParams = useSearchParams();
    const cookies = useCookies()
    const { toast } = useToast()
    const [users, setUsers] = useState<Array<{id:string, name:string}>>([])
    useEffect(() => {
        //check if the user has a cookie set with their ID and name
        //if not, create them
        if(!cookies.get('userID') || cookies.get('userID') == 'undefined' || cookies.get('userName') == ''){
            console.log("No user ID found, generating a new one")
            const id = uuidv7()
            const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

            const randomName = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] }); // big_red_donkey
            cookies.set('userID', id)
            cookies.set('userName', randomName)
        }

        //get the game ID from the URL and connect to the websocket server
        const ws = new WebSocket(`ws://localhost:3001/v1/game/coordinator/${searchParams.get('gameID')}?userid=${cookies.get('userID')}&username=${cookies.get('userName')}`);
        ws.onopen = ()=>{
            ws.send(JSON.stringify({type: 'updateReadyState'}))
            ws.send(JSON.stringify({type: 'getUsers'}))
        }
        ws.onmessage = (event) => {
            let message = JSON.parse(event.data)
            if(message.type == 'updateReadyState'){
                if(message.started != true){
                    console.log('Game has not started yet')
                }
            }
            if(message.type == 'error' && message.text == 'Game not found'){
                toast({description: 'Game not found', title: 'Error'})
                window.location.href = '/'
            }
            if(message.type == 'removeUser'){
                toast({description: `${message.userName} has left the game`, title: 'User Left'})
            }
            if(message.type == 'newUser'){
                toast({description: `${message.userName} has joined the game`, title: 'New User'})
            }
            if(message.type == 'getUsers'){
                setUsers(message.users)
            }
            console.log(message)
        }
        setWebsocket(ws)
    }, []);
    function updateScores(game){
        setGame(game)
    }

    useEffect(() => {
        console.log('Users have been updated', users)
        let gameTest = game
        let usersInGameObj = Object.keys(game.users)
        for(const user of users){
            console.log('Checking user', user)
            if(!usersInGameObj.includes(user.userID)){
                gameTest.users[user.userID] = {userName:user.userName, points: user.points}
            }
        }
        console.log('Setting game from: ', game, 'to', gameTest)
        setGame(gameTest)
    }, [users]);
    useEffect(() => {
        console.log('Game has been updated', game)
    }, [game]);
    return(
        <div className="gameMain">
            {
                users?
                    <Scoreboard users={users} callback={updateScores}/>
                    :
                    null
            }
            <CardSelector />
            <Toaster />
        </div>
    )
}