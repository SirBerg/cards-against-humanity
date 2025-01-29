//Creates the database and tables if they don't exist
import { Database } from "bun:sqlite";
import cards from "../../../data/cah-cards-full.json";
const db = new Database("data/main.sqlite3");
import {uuidv7} from "@/utils/uuid";
db.query(`DROP TABLE IF EXISTS manifest`).all()
db.query(`DROP TABLE IF EXISTS cards`).all()
db.query(`DROP TABLE IF EXISTS games`).all()

db.query(`
        CREATE TABLE IF NOT EXISTS manifest
            (
                id         STRING PRIMARY KEY NOT NULL,
                name       STRING,
                official   BOOLEAN,
                whiteCount INTEGER,
                blackCount INTEGER
            );

`).all()
db.query(`        
        CREATE TABLE IF NOT EXISTS cards
            (
                id       STRING PRIMARY KEY NOT NULL,
                type     STRING,
                content  STRING,
                pickCount INTEGER,
                packID   STRING REFERENCES manifest(id)
            );
`).all()
db.query(`
        CREATE TABLE IF NOT EXISTS games
            (
                id STRING PRIMARY KEY NOT NULL,
                ownerID STRING,
                allowedPacks STRING,
                allowedIDs STRING,
                bannedIDs STRING,
                started BOOLEAN,
                startedAt STRING,
                ended BOOLEAN,
                allowBlackCardDupes BOOLEAN,
                blackCardsPlayed STRING
            );
`).all()

//Go through the file and add everything to the database
for(const deck of cards){
    console.log('Inserting: ', deck.name)
    const cardID = uuidv7()
    //insert the "manifest" of the deck, so what the deck is called, how many cards it has, etc
    db.query(`
        INSERT INTO manifest (id, name, official, whiteCount, blackCount) VALUES (?, ?, ?, ?, ?)
    `).run(cardID, deck.name, deck.official, deck.white.length, deck.black.length)

    //insert the cards
    const cardInsert = db.prepare(`INSERT INTO cards (id, type, content, pickCount, packID) VALUES (?, ?, ?, ?, ?)`)
    const cardTransaction = db.transaction((cards, cardType) =>{
        for(const card of cards){
            cardInsert.run(uuidv7(), cardType, card.text, card.pick ? card.pick : 0, cardID)
        }
    })
    cardTransaction(deck.white, "white")
    cardTransaction(deck.black, "black")
    console.log('Inserted: ', deck.name)
}