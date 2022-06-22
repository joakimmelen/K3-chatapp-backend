const express = require(`express`);
const app = express();
const http = require(`http`);
const fs = require("fs");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

const PORT = process.env.PORT || 666

const db = require("./config/database")
// io.use((socket, next) => {
//     if (token) {
//       const user = getUser();
//       socket.user = user;
//     }
//     next();
// })


function getRooms() { 
    const sql = `SELECT * FROM rooms`

    return new Promise((resolve, reject) => {
        db.all(sql, (error, rows) => {
            if (error) {
                console.error(error.message)
                reject(error)
            }
            resolve(rows)
            // console.log(rows)
        })
    })
}

function getUsers() { 
    const sql = `SELECT * FROM users`

    return new Promise((resolve, reject) => {
        db.all(sql, (error, rows) => {
            if (error) {
                console.error(error.message)
                reject(error)
            }
            resolve(rows)
        })
    })
}

function getMessages(room) { 
    const sql = `SELECT * FROM messages WHERE room_id = ?`

    return new Promise((resolve, reject) => {
        db.all(sql, room, (error, rows) => {
            if (error) {
                console.error(error.message)
                reject(error)
            }
            resolve(rows)
        })
    })
}

function straightToTheLog(data) {
    const fsData = JSON.stringify(data);
    if (data.message) {
        fs.appendFile("DOOM_LOG.txt", fsData + "\n", (error) => {
            if (error) {
                return (
                console.log("Error writing to DOOM_LOG.txt")
                )
            } else {
               return console.log("Attemp to store data in DOOM_LOG.txt was successful")
            }
        })
    }
}

io.use((socket, next) => {
    socket.on("message", (date, input, user, room) => {
        const data = {
            date: date,
            message: input,
            user: user,
            room: room
        }
      straightToTheLog(data);
    });
    next();
  });

io.on(`connection`, (socket) => {
    console.log(`User with id ${socket.id} has connected`);

    // Rooms
    socket.on("create_room", async (room) => {
        const sql = `INSERT INTO rooms (name) VALUES (?)`
        const rooms = await getRooms();
        if (!rooms.filter(e => e.name === room).length > 0) {
            db.run(sql, room, (error) => {
                if (error) console.error(error.message)
            }) 
            console.log(`Created room: ${room}`)
            socket.emit("room_created", room)
        } else {
            console.log("Room already exists")
            socket.emit("room_error", `Error creating room "${room}", it might already exist`)
        }
    })

    socket.on("join_room", async (room) => {
        // room: string med rumnamnet
        const rooms = await getRooms();
        if (rooms.filter(e => e.name === room).length > 0) {
        console.log(`${socket.id} has joined ${room}`)
        socket.join(room);
    
        io.to(room).emit("joined_room", socket.id);
        // const users = getUsers();
        const messages = await getMessages(room);
        socket.emit("welcome_to_room", [messages, room])
        } else {
            socket.emit("room_error", "No such room, create one or try another name")
        }
      })
    
      socket.on("leave_room", (data) => {
        // data: string med rumnamnet
        console.log(`${socket.id} has left room ${data}`)
        socket.leave(data);
        console.log(socket.rooms);
      })

      socket.on("remove_room", async (room) => {
        const sql = `DELETE FROM rooms WHERE name = ?`
        const rooms = await getRooms();
        if (rooms.filter(e => e.name === room).length > 0) {
            db.run(sql, room, (error) => {
                if (error) console.error(error.message)
            })
        } else {
            console.log("No such room");
            socket.emit("error_remove_room", "No such room")
        }
      })

      socket.on("get_rooms", async () => {
        const rooms = await getRooms();
        socket.emit("all_rooms", rooms)
      })
    
      io.emit("new_client", "A new client has joined");

      socket.on("create_user", async (user) => {
        const sql = `INSERT INTO users (name) VALUES (?)`
        const users = await getUsers();
        if (!users.filter(e => e.name === user).length >0) {
            db.run(sql, user, (error) => {
                if (error) console.error(error.message)
            })
            console.log(`Created user: ${user}`)
            socket.emit("user_created", user)
        } else {
            console.log("User already exists")
            socket.emit("user_error", `User with the name "${user}" already taken`)
        }
      })

      socket.on("login_user", async (user) => {
        const users = await getUsers();
        if (!users.filter(e => e.name === user).length > 0) {
            socket.emit("error_loggedin", "User does not exist")
        } else {
            socket.emit("user_loggedin", user)
        }
      })
    
      socket.on("message", async (date, data, user, room) => {
        const sql = `INSERT INTO messages (date, message, user, room_id, user_id) VALUES (?, ?, ?, ?, ?);`
        if (!user) {
            console.log("ERROR_Must be logged in as user")
        } else {
        db.run(sql, [date, data, user, room, socket.id], (error) => {
            if (error) console.error(error.message)
            const newMessage = {
                date: date,
                message: data,
                room: room,
                user: user,
                userId: socket.id
            }
            socket.to(room).emit("new_message", newMessage)
        })
    }
      })
    
      //data: string
    //   socket.on("new_message", (data) => {
    //     const sql = "";
    //     db.run(sql);

    //     const newMessage = {
    //         message: data,
    //         room: "room1",
    //         user: socket.id
    //     }

    //     socket.broadcast.emit("new_message", newMessage)

    //   })

      // data: { message: "", to: "" }
      socket.on("direct_message", (data) => {
        socket.to(data.to).emit("message", data.message)
      })
    
      socket.on("disconnect", (reason) => {
        console.log(`User ${socket.id} disconnected. Reason: ${reason}`)
      })
    })

server.listen(PORT, () => {
    console.log(`Listening on ${PORT} fo sho`)
})