'use client'
import './gameHandler.css'
import {useEffect, useState} from "react";
import { uuidv7 } from "@/utils/uuid";
import { useCookies } from 'next-client-cookies';
export default function GameHandlerHome(){
    const cookies = useCookies()
    const [user, setUser] = useState({id:'', name:''})
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
    },[])
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

            </div>
        </div>
    )
}