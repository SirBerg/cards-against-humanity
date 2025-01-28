import DeckPicker from '../components/home/deckPicker'
import GameHandlerHome from "@/components/home/gameHandlerHome";
export default function Home() {
  return (
    <div className="mainHome">
        <h1>
            Hey there!
        </h1>
        <h3>
            Choose some decks to start playing
        </h3>
        <GameHandlerHome />
        <DeckPicker/>
    </div>
  );
}
