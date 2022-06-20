const sqlite3 = require("sqlite3").verbose()

const db = new sqlite3.Database("./database.sqlite", (error) => {
    if (error) {
        console.error(error.message)
        throw error
    }
    
    console.log("Connection established to da base")

    const statements = 
    {
        users: `
        CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
        )`
        ,
        rooms: `
        CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
        )`
        ,
        messages: `
        CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        room_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (room_id)
            REFERENCES rooms (id)
            ON DELETE CASCADE
        FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE CASCADE
        )`
    }

    db.run(statements.users, (error) => {
        if (error) console.error(error.message)
    })
    db.run(statements.rooms, (error) => {
        if (error) console.error(error.message)
    })
    db.run(statements.messages, (error) => {
        if (error) console.error(error.message)
    })

    const insertUser = "INSERT INTO users (name) VALUES (?)"
    const insertRoom = "INSERT INTO rooms (name) VALUES (?)"
    // db.run(insertUser, "Jocke")
    // db.run(insertUser, "Nils")
    // db.run(insertUser, "Oscar")
    // db.run(insertUser, "Marcus")
    // db.run(insertRoom, "Room1")
    // db.run(insertRoom, "Room2")
    // db.run(insertRoom, "Room3")
    // db.run(insertRoom, "Room4")
})

module.exports = db