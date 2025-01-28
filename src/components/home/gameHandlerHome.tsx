import './gameHandler.css'
export default function GameHandlerHome(){
    return (
        <div className="gamingInputs">
            <input className="gamingInputsNameInput" placeholder="Your Name"></input>
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