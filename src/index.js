const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const { generateMessage, generateLocationMessage } = require("./utils/messages");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/user");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

const ADMIN = "Admin"
io.on("connection", (socket) => {
    console.log("New websocket connection");

    // socket.emit("message", generateMessage("Welcome to the chat!!!"));
    // socket.broadcast.emit("message", generateMessage("A new user has joined."));

    socket.on("join", (options, callback) => {
        const { error, user } = addUser({ 
            id: socket.id,
            ...options
        });

        if (error) {
            return callback(error);
        }
 
        socket.join(user.room);

        socket.emit("message", generateMessage(ADMIN, "Welcome to the chat!!!"));
        socket.broadcast.to(user.room).emit("message", generateMessage(ADMIN, `${user.username} has joined!`));

        console.log("join", getUsersInRoom(user.room));
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        });

        callback();
    })

    socket.on("sendMessage", (message, callback) => {
        const filter = new Filter();
        const user = getUser(socket.id);

        if (filter.isProfane(message)) {
            return callback("This is not allowed!!!");
        }

        if (user) {
            io.to(user.room).emit("message", generateMessage(user.username, message));
            callback();
        }
    });

    socket.on("sendLocation", (location, callback) => {
        const user = getUser(socket.id);

        if (user) {
            io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`));
            callback();
        }
    });

    socket.on("disconnect", () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit("message", generateMessage(ADMIN, `${user.username} has left!`));
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    });
});

server.listen(port, () => {
    console.log("Server is running!");
})