'use server'
import DeckPicker from '../components/home/deckPicker'
import GameHandlerHome from "@/components/home/gameHandlerHome";
export default async function Home() {
    const apiBasePath = process.env.API_BASE
    if(!apiBasePath){
        console.error('API_BASE environment variable not set')
    }
    else{
        console.log('API_BASE:', apiBasePath)
    }
    return (
        <div className="mainHome">
            <h1>
                Hey there!
            </h1>
            <h3>
                Choose some decks to start playing
            </h3>
            <DeckPicker/>
        </div>
  );
}
