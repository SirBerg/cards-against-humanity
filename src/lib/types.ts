export type clientType = {
    userID:string
    userName:string
    cards:Array<{cardID:string, pack:string}>
    points:number
    isConnected:boolean,
    isTurn:boolean,
    submittedCards:Array<{cardID:string, pack:string, revealed:boolean}>
}
export type gamesType = {
    [key:string]:{
        ownerID:string
        allowedPacks:string
        bannedIDs:[]
        started:boolean
        startedAt:string
        currentBlackCard:{cardID:string, pack:string}
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
    currentBlackCard:{cardID:string, pack:string}
    clients:{[key:string]:clientType}
    starting:boolean
}
export type card = {content:string, pack:string, id:string}