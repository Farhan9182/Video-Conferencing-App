const express = require("express");
const app = express();
const cors = require('cors')
app.use(cors())
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server)
// Peer

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
    debug : true
});

app.use('/peerjs', peerServer);

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, rsp) => {
    rsp.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
    res.render("room", { roomId: req.params.room });
});

app.get("/leave", (req, res) => {
    res.render("leave");
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId, username) => {
        socket.join(roomId);
        socket.to(roomId).broadcast.emit("user-connected", userId);

        socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message, username);
        });

        socket.on("share", () => {
            socket.to(roomId).broadcast.emit("shareScreen", userId, username);
        });

        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit('user-disconnected', userId)
        });
    });
});

server.listen(process.env.PORT || 3000);