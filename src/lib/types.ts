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
        queue:Array<string>
    }
}

export type gameType = {
    ownerID:string
    allowedPacks:string
    bannedIDs:string
    started:boolean
    startedAt:string
    currentBlackCard:clientCard
    clients:{[key:string]:clientType}
    starting:boolean
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
    packID:string
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