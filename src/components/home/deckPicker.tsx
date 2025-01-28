'use server'
import { Database } from "bun:sqlite"
import {DeckContainer} from './deck'

export default async function DeckPicker() {
    const db = new Database("data/main.sqlite3");
    const manifest = db.query(`SELECT * FROM manifest`).all()
    return (
        <div>
            <DeckContainer manifest={manifest} />
        </div>
    )
}
