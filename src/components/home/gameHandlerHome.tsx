'use client'
import './gameHandler.css'
import {useEffect, useState, useRef} from "react";
import { uuidv7 } from "@/utils/uuid";
import { useCookies } from 'next-client-cookies';
export default function GameHandlerHome(){
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
        if(!user){
            console.log("No user ID found, generating a new one")
            const id = uuidv7()
            user = id
            cookies.set('userID', id)
            cookies.set('userName', '')
        }
        console.log('User ID: ', user)
        setUser({id:user, name:cookies.get('userName')})

        //request a new game
        const myHeaders = new Headers();
        myHeaders.append("userID", user.id);
        myHeaders.append("userName", user.name);

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            redirect: "follow"
        };
        fetch("http://localhost:3001/v1/game/coordinator", requestOptions)
            .then((response) => response.text())
            .then((result) => setGameID(JSON.parse(result).gameID))
            .catch((error) => console.error(error));
    },[])
    useEffect(() => {
        if (gameID && !webSocket) {
            console.log(`ws://localhost:3001/v1/game/coordinator/${gameID}?userid=${user.id}&username=${user.name}`);
            const ws = new WebSocket(`ws://localhost:3001/v1/game/coordinator/${gameID}?userid=${user.id}&username=${user.name}`);
            ws.onopen = () => {
                console.log("Connected to the websocket server");
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
            };
            setWebSocket(ws);
        }
    }, [gameID]);
    useEffect(()=>{
        userRef.current = users
        console.log('Users', users)
    }, [users])
    useEffect(() => {
        console.log(user)
        cookies.set('userName', user.name)
    }, [user]);
    return (
        <div className="gamingInputs">
            <input className="gamingInputsNameInput" placeholder="Your Name"  onChange={(event)=>{
                setUser({id:cookies.get('userID') as string, name:event.target.value})
            }} value={user.name}></input>
            <div className="gamingButtons">
                <button className="gamingInputButton">
                    Start Game
                </button>
                <button className="gamingInputButton">
                    Copy Code
                </button>
            </div>
            <div className="Players">
                {
                    users.map((user)=>{
                        return (
                            <div className="Player" key={user.id}>
                                <p>{user.name}</p>
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}