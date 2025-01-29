
## Developement

```bash
bun --bun run dev # the --bun is very important as bun:sqlite fails to import without it in route handlers
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


A client must first call the `/v1/game/coordinator` as a post request with these Header vars set:
```
userid: <userid of the user>
username: <username of the user>
```
This will create a game in the database and return the id of the game to the client.
Now, the client can connect to the websocket at `/v1/game/coordinator/<game-id>` with the Headers set:
```
userid: <userid of the user>
username: <username of the user>
```
The client will now receive messages from the server about the game state and can send messages to the server to make moves.


