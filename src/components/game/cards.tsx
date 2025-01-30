import './cards.css'
export function Card(){
    return(
        <div className="whiteCard">
            This is a test Card!
        </div>
    )
}

export default function CardSelector(){
    return(
        <div className="cardSelector">
            <Card />
            <Card />
            <Card />
            <Card />
            <Card />
        </div>
    )
}