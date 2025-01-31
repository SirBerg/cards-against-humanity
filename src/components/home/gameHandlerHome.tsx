'use client'
import './gameHandler.css'
import {useEffect, useState, useRef} from "react";
import { uuidv7 } from "@/utils/uuid";
import { useCookies } from 'next-client-cookies';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import {toast, useToast} from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster"
import {gameType} from "@/lib/types";

export default function GameHandlerHome({callback}:{callback:Function}) {
    const cookies = useCookies()
    const [user, setUser] = useState({id:'', name:''})
    const [gameID, setGameID] = useState('')
    const [webSocket, setWebSocket] = useState<WebSocket>()
    const [game, setGame] = useState<gameType | null>(null)
    const { toast } = useToast()
    useEffect(()=>{
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
            cookies.set('userID', id)
            cookies.set('userName', randomName)
        }
        console.log('User ID: ', user)
        setUser({id:user, name:cookies.get('userName')})
        console.log('User', user)
        console.log('Cookies', cookies.get('userName'))
        //request a new game
        const myHeaders = new Headers();
        myHeaders.append("userID", cookies.get('userID') as string);
        myHeaders.append("userName", cookies.get('userName') as string);

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            redirect: "follow"
        };
        fetch("http://localhost:3001/v2/game/coordinator", requestOptions)
            .then((response) => response.text())
            .then((result) => {
                console.log(result)
                setGameID(JSON.parse(result).gameID)
            })
            .catch((error) => console.error(error));
    },[])
    useEffect(() => {
        console.log('USING GAMESTATE:', game)
    }, [game]);
    useEffect(() => {
        if (gameID && !webSocket) {
            console.log(`ws://localhost:3001/v2/game/coordinator/${gameID}?userid=${user.id}&username=${user.name}`);
            const ws = new WebSocket(`ws://localhost:3001/v2/game/coordinator/${gameID}?userid=${user.id}&username=${user.name}`);
            ws.onopen = () => {
                console.log("Connected to the websocket server");
            };
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                //a message is always a complete game state so we don't have to handle it here but rather on the server
                if(message.type === 'gameState'){
                    console.log('Updated Game State Received')
                    setGame(message.game)
                }
                if(message.type === 'startGame'){
                    window.location.href = `/game?gameID=${gameID}`
                }
            };
            setWebSocket(ws);
        }

        if(gameID){
            //update the gameID in the parent component
            callback(gameID)
        }
    }, [gameID]);

    //update the user
    useEffect(() => {
        cookies.set('userName', user.name)
        webSocket?.send(JSON.stringify({type: 'updateUser', userID: user.id, userName: user.name}));
    }, [user]);

    function banUser(userID:string){
        //ensure the user is not banning themselves
        if(userID === user.id){
            toast({description: 'You cannot ban yourself', title: 'Error:'})
            return
        }
        webSocket?.send(JSON.stringify({type: 'banUser', userID}));
        toast({description: 'User has been banned', title: 'Success:'})
    }
    function startGame(){
        if(!game){
            toast({description: 'Game not found', title: 'Error:'})
        }
        let connectedUsers = 0
        for(const user of Object.keys(game.clients)){
            if(game.clients[user].isConnected){
                connectedUsers++
            }
        }
        if(connectedUsers < 2){
            toast({description: 'You need at least 2 players to start the game', title: 'Error:'})
            return
        }
        if(!game?.allowedPacks || game?.allowedPacks.length < 1){
            toast({description: 'You need at least 1 Deck to start the game', title: 'Error:'})
            return
        }
        console.log('Starting the game')
        if(!webSocket){
            toast({description: 'Websocket not connected', title: 'Error:'})
            return
        }
        webSocket.send(JSON.stringify({type: 'startGame'}))
    }
    return (
        <div className="gamingInputs">
            <input className="gamingInputsNameInput" placeholder="Your Name"  onChange={(event)=>{
                setUser({id:cookies.get('userID') as string, name:event.target.value})
            }} value={user.name}></input>
            <div className="gamingButtons">
                <button className="gamingInputButton" onClick={()=>{startGame()}}>
                    Start Game
                </button>
                <button className="gamingInputButton" onClick={()=>{
                    navigator.clipboard.writeText(`http://localhost:3000/waitingRoom?gameID=${gameID}`).then(()=>{
                        alert('Copied to clipboard')
                    })
                }}>
                    Copy Code
                </button>
            </div>
            <div className="PlayerContainer">
                {
                    game ? Object.keys(game.clients).map((user)=>{
                        console.log('rendering user:', user)
                        const userobj = game.clients[user]
                        if(!userobj.isConnected){
                            return null
                        }
                        return (
                            <TooltipProvider key={userobj.userID}>
                                <Tooltip>
                                    <TooltipTrigger
                                        className="Player"
                                        onClick={() => {
                                            banUser(userobj.userID)
                                        }}
                                        style={{
                                            backgroundColor: userobj.userID === user.id ? 'red' : 'blue'
                                        }}
                                    >
                                        <p>{userobj.userName[0].toUpperCase()}</p>

                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Username: {userobj.userName}</p>
                                        <p>(Click to remove this user)</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )
                    }) : null
                }
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Skeleton className="w-[50px] h-[50px] rounded-full" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Waiting for Players...</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <Toaster />
        </div>
    )
}