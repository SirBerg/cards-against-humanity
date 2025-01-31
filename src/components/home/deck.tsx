'use client'
import {useState, useEffect} from "react";
import { CheckCheck } from 'lucide-react';
import './deck-layout.css'
import GameHandlerHome from "@/components/home/gameHandlerHome";
import {useCookies} from "next-client-cookies";


export function DeckContainer({manifest}: {manifest: Array<any>}) {
    const [selectedDecks, setSelectedDecks] = useState<Array<string>>([])
    const [showOfficial, setShowOfficial] = useState<boolean>(false)
    const [officialIsSelected, setOfficialIsSelected] = useState<boolean>(true)
    const [customIsSelected, setCustomIsSelected] = useState<boolean>(false)
    const [gameID, setGameID] = useState<string>('')
    const cookies = useCookies()
    useEffect(()=>{
        let initialSelectedDecks = []
        for(const decks of manifest) {
            if(decks.official == "1") {
                initialSelectedDecks.push(decks.id)
            }
        }
        setSelectedDecks(initialSelectedDecks)
    }, [])
    useEffect(() => {
        let newSelectedDecks = []
        if(officialIsSelected) {
            for(const decks of manifest) {
                if(decks.official == "1") {
                    newSelectedDecks.push(decks.id)
                }
            }
        }
        if(customIsSelected) {
            for(const decks of manifest) {
                if(decks.official == "0") {
                    newSelectedDecks.push(decks.id)
                }
            }
        }
        setShowOfficial(false)
        setSelectedDecks(newSelectedDecks)
    }, [officialIsSelected, customIsSelected]);

    //this handles the sending of updates to the selected packs to the server
    useEffect(() => {
        if(!gameID || gameID == '') {
            console.log('Will not update packs without a game ID')
            return
        }
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("userID", cookies.get('userID') as string);
        const raw = JSON.stringify({
            "packs": selectedDecks
        });
        const requestOptions = {
            method: "PATCH",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };
        fetch(`http://localhost:3001/v2/game/coordinator/${gameID}/packs`, requestOptions)
            .then((response) => response.text())
            .then((result) => console.log(result))
            .catch((error) => console.error(error));
    }, [selectedDecks, gameID]);
    useEffect(() => {
        console.log('GAME ID IN DECK COMPONENT', gameID)
    }, [gameID])
    return (
        <div>
            <GameHandlerHome callback={((gameID:string)=>{setGameID(gameID)})} />
            <div className="deckContainer">
                <button
                    onClick={() => {
                        setOfficialIsSelected(!officialIsSelected)
                    }}
                    className={`deckButtonInactive ${officialIsSelected ? "deckButtonActive" : null}`}>
                    <h1>
                        Official Decks
                    </h1>
                </button>
                <button
                    onClick={() => {
                        setCustomIsSelected(!customIsSelected)
                    }}
                    className={`deckButtonInactive ${customIsSelected ? "deckButtonActive" : null}`}>
                    <h1>
                        Custom Decks
                    </h1>

                </button>
                <div className="deckGroup">
                    <button className="deckGroupButton" onClick={() => setShowOfficial(!showOfficial)}>
                        <h1>
                            Show all Decks
                        </h1>
                    </button>
                    <div>
                        {showOfficial ? manifest.map((deck) => {
                            return (
                                <div key={deck.id}
                                     className={`deck ${selectedDecks.includes(deck.id) ? `isActive` : null}`}
                                     onClick={() => {
                                         if (selectedDecks.includes(deck.id)) {
                                             setSelectedDecks(selectedDecks.filter((deckId) => deckId != deck.id))
                                         } else {
                                             setSelectedDecks([...selectedDecks, deck.id])
                                         }
                                     }}>
                                    {deck.name}
                                </div>
                            )
                        }) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}