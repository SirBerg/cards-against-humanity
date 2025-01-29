export default async function coordinator(ws:WebSocket, req:Request){
    console.log('Socket connected')
    ws.on('message', (msg:string)=>{
        console.log('Received:', msg)
        ws.send(msg)
    })
    ws.on('close', ()=>{
        console.log('Connection closed')
    })
    ws.on('open', ()=>{
        console.log('Connection opened')
    })
    ws.on('error', (err:Error)=>{
        console.error(err)
    })
}