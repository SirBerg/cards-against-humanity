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

export default function GameHandlerHome({selectedDecks}:{selectedDecks:Array<string>}) {
    const cookies = useCookies()
    const [user, setUser] = useState({id:'', name:''})
    const [gameID, setGameID] = useState('')
    const [webSocket, setWebSocket] = useState<WebSocket>()
    const [users, setUsers] = useState<Array<{id:string, name:string}>>([])
    const userRef = useRef(users)
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
        fetch("http://localhost:3001/v1/game/coordinator", requestOptions)
            .then((response) => response.text())
            .then((result) => {
                console.log(result)
                setGameID(JSON.parse(result).gameID)
            })
            .catch((error) => console.error(error));
    },[])
    useEffect(() => {
        if (gameID && !webSocket) {
            console.log(`ws://localhost:3001/v1/game/coordinator/${gameID}?userid=${user.id}&username=${user.name}`);
            const ws = new WebSocket(`ws://localhost:3001/v1/game/coordinator/${gameID}?userid=${user.id}&username=${user.name}`);
            ws.onopen = () => {
                console.log("Connected to the websocket server");
                //send a message with all decks that are currently selected
                console.log('Selected Decks', JSON.stringify({type: 'updateDecks', deckIDs: selectedDecks}))
                ws.send(JSON.stringify({type: 'updateDecks', deckIDs: selectedDecks}))
            };
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                console.log('Msg', message, 'Users', userRef.current);
                if (message.type === 'newUser') {
                    setUsers((prevUsers) => {
                        const updatedUsers = [...prevUsers, { id: message.userID, name: message.userName }];
                        userRef.current = updatedUsers;
                        return updatedUsers;
                    });
                }
                if (message.type === 'removeUser'){
                    setUsers((prevUsers) => {
                        const updatedUsers = prevUsers.filter((user) => user.id !== message.userID);
                        userRef.current = updatedUsers;
                        return updatedUsers;
                    });
                }
                if (message.type === 'updateUser'){
                    setUsers((prevUsers) => {
                        let updatedUsers = prevUsers.filter((user) => user.id !== message.userID);
                        updatedUsers.push({id: message.userID, name: message.userName});
                        console.log('Updated Users', updatedUsers);
                        userRef.current = updatedUsers;
                        return updatedUsers;
                    });
                }
                if (message.type === 'startGame'){
                    console.log('Starting game');
                    window.location.href = `/game?gameID=${gameID}`;
                }
            };
            setWebSocket(ws);
        }
    }, [gameID]);
    useEffect(()=>{
        userRef.current = users
    }, [users])
    useEffect(() => {
        cookies.set('userName', user.name)
        webSocket?.send(JSON.stringify({type: 'updateUser', userID: user.id, userName: user.name}));
    }, [user]);

    //handle the updating of the selected decks
    useEffect(()=>{
        if(webSocket){
            webSocket.send(JSON.stringify({type: 'updateDecks', deckIDs: selectedDecks}))
        }
    }, [selectedDecks])
    function banUser(userID:string){
        //ensure the user is not banning themselves
        if(userID === user.id){
            return
        }
        webSocket?.send(JSON.stringify({type: 'banUser', userID}));
    }
    function startGame(){
        if(users.length > 1){
            webSocket?.send(JSON.stringify({type: 'startGame'}));
        }
        else{
            alert('You need at least 2 players to start the game')
        }
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
                    users.map((user)=>{
                        console.log('rendering user:', user)
                        return (
                            <TooltipProvider key={user.id}>
                                <Tooltip>
                                    <TooltipTrigger
                                        className="Player"
                                        onClick={() => {
                                            banUser(user.id)
                                        }}
                                        style={{
                                            backgroundColor: user.id === user.id ? 'red' : 'blue'
                                        }}
                                    >
                                        <p>{user.name[0].toUpperCase()}</p>

                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Username: {user.name}</p>
                                        <p>(Click to remove this user)</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )
                    })
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
        </div>
    )
}