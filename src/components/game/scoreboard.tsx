import './scoreboard.css'
export default function Scoreboard({users, callback}:{users:Array<{userID:string, userName:string, points:number}>, callback:Function}){
    return (
        <div className="scoreboard">
            <h2>
                Scoreboard
            </h2>
            {
                users.map((user)=>{
                    return(
                        <div key={user.userID} className="scoreboardUser">
                            <div className="scoreboardUserName">{user.userName}: </div>
                            <div className="scoreboardUserPoints">{user.points}</div>
                        </div>
                    )
                })
            }
        </div>
    )
}