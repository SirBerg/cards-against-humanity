export type clientType = {
    userID:string
    userName:string
    cards:Array<clientCard>
    points:number
    isConnected:boolean,
    isTurn:boolean,
    submittedCards:Array<clientCard>
}
export type gamesType = {
    [key:string]:{
        ownerID:string
        allowedPacks:string[]
        bannedIDs:[]
        started:boolean
        startedAt:string | null
        currentBlackCard:card
        clients:{[key:string]:clientType}
        websockets:{[key:string]:WebSocket}
        requests:{[key:string]:Request}
        starting:boolean,
        queue:Array<string>,
        status: "playing" | "judging" | "lobby",
        judging: {
            "focusedPlayer":string,
        }
    }
}

export type gameType = {
    ownerID:string
    allowedPacks:string
    bannedIDs:string
    started:boolean
    startedAt:string
    currentBlackCard:card
    clients:{[key:string]:clientType}
    starting:boolean,
    status: "playing" | "judging" | "lobby",
    judging: {
        "focusedPlayer":string,
    }
}
export type card = {
    content:string,
    id:string,
    pickCount:number,
    packID:string,
    packName:string,
    type:"white" | "black"
}

export type clientCard = {
    id:string,
    packID:string,
    isRevealed:boolean
}

export type cardMemoryObject = {[key:string]: {
        black: {[key:string]:{
                id:string,
                type:string,
                content:string,
                pickCount:number,
                packID:string
            }
        }
        white: {[key:string]:{
                id:string,
                type:string,
                content:string,
                pickCount:number,
                packID:string
            }
        }
        blackCount:number
        whiteCount:number
        packName:string
}}

export type packManifest = Array<string>

//This extension provides the necessary information to dynamically show the user the current black card
//with selected but not played cards
export interface clientCardExtension extends clientCard{
    played:boolean
}