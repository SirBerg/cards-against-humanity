import express from 'express'
import expressWs, {WebsocketRequestHandler} from 'express-ws'
import coordinator from './v1/game/coordinator'
const app = express()

expressWs(app)
//@ts-ignore testing testing
app.ws('/v1/game/coordinator', async (ws:WebsocketRequestHandler, req:Request)=>{
    //@ts-ignore testing testing
    coordinator(ws, req)
})

app.get('/v1/game/coordinator', (req, res)=>{
    res.status(426).send('Upgrade to a websocket connection').setHeaders({
        //@ts-ignore testing testing
        'Upgrade': 'websocket',
        'Connection': 'Upgrade'
    })
})
app.listen(3001, ()=>{
    console.log('Server is running on port 3001')
})
