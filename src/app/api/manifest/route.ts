'use server'
//import type { NextApiRequest } from 'next'
import { NextResponse } from 'next/server'
import { Database } from "bun:sqlite"

export async function GET() {
    const db = new Database("data/main.sqlite3");
    const manifest = db.query(`SELECT * FROM manifest`).all()
    db.close()
    return NextResponse.json(manifest)
}