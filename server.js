const express = require(`express`);
const app = express();
const http = require(`http`);
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
function getMessages() { 
    const sql = `SELECT * FROM messages`

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

io.on(`connection`, (socket) => {
    console.log(`User with id ${socket.id} has connected`);

    // Rooms
    socket.on("join_room", (room) => {
        // room: string med rumnamnet
        console.log(`${socket.id} has joined ${room}`)
        socket.join(room);
    
        io.to(room).emit("joined_room", socket.id);
        // const users = getUsers();
        console.log(getMessages());
      })
    
      socket.on("leave_room", (data) => {
        // data: string med rumnamnet
        console.log(`${socket.id} has left room ${data}`)
        socket.leave(data);
    
        console.log(socket.rooms);
      })
    
      io.emit("new_client", "A new client has joined");
    
      socket.on("message", (data) => {
        const sql = `INSERT INTO messages (message, room_id, user_id) VALUES (?, ?, ?);`
        console.log(`${socket.id} has sent ${data}`)
        db.run(sql, [data, "room1", socket.id], (error) => {
            if (error) reject(error)
        })
        const messages = getMessages();
        console.log(getMessages())
        socket.broadcast.emit("messages", messages)
      })
    
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