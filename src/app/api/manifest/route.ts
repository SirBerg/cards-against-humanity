//import type { NextApiRequest } from 'next'
import { NextResponse } from 'next/server'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

// you would have to import / invoke this in another file
async function openDb () {
    return open({
        filename: './database.db',
        driver: sqlite3.Database
    })
}
export async function GET() {
    const db = await openDb()
    const row = await db.all('SELECT * FROM manifest')
    await db.close()
    return NextResponse.json({ rows: row })
}

export async function POST() {
    const db = await openDb()
    await db.all('CREATE TABLE IF NOT EXISTS manifest (id INTEGER)')
    await db.all('INSERT INTO manifest (id) VALUES (1)')
    await db.close()
    return NextResponse.json({ success: true })
}