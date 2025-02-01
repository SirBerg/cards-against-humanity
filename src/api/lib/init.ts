import {card, cardMemoryObject} from "@/lib/types";
import {Logger} from "@/lib/logger";
import {Database} from 'bun:sqlite'

//this function initializes all the stuff needed for the webserver
export async function webserverInit(log:Logger):Promise<{memoryCards:cardMemoryObject, manifestIDs:string[]}>{
    return new Promise((resolve)=>{
        //initialize the db
        const db = new Database('data/main.sqlite3')

        //get all the manifest IDs
        const manifestIDs = db.query('SELECT id FROM manifest').all().map((row:any )=>row.id)
        //create the cards.ts object so we can avoid querying the database for every card
        const cards:Array<card> = db.query(`
            SELECT 
                cards.id as id, 
                cards.content as content, 
                cards.pickCount as pickCount, 
                cards.packID as packID, 
                m.name as packName,
                cards.type as type
            FROM cards INNER JOIN main.manifest m on cards.packID = m.id
        `).all() as Array<card>
        log.debug(`Found ${cards.length} cards in the database, building RAM object`)
        const memoryCards:cardMemoryObject = {}
        for(const card of cards){
            if(!memoryCards[card.packID]){
                memoryCards[card.packID] = {
                    black: {},
                    white: {},
                    blackCount: 0,
                    whiteCount: 0,
                    packName: card.packName
                }
            }
            if(card.type == 'black'){
                if(card.pickCount > 5){
                    continue
                }
                memoryCards[card.packID].blackCount++
                memoryCards[card.packID].black[card.id] = card
            }
            else{
                memoryCards[card.packID].whiteCount++
                memoryCards[card.packID].white[card.id] = card
            }
        }
        log.debug('Finished building RAM object')

        resolve({'memoryCards':memoryCards, 'manifestIDs':manifestIDs})
    })

}