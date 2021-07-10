const socket = io("/");
var peer = new Peer(undefined, {
    path: "/",
    host: "/",
    port: "443"
});

const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("all_messages");
const main__chat__window = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;


const user = prompt("Enter your name");


const peers = {};
let myVideoStream;
var currentPeer;
var getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

navigator.mediaDevices
    .getUserMedia({
        video: true,
        audio: true,

    })
    .then((stream) => {
        myVideoStream = stream;
        addVideoStream(myVideo, stream);

        peer.on("call", (call) => {
            call.answer(stream);
            const video = document.createElement("video");

            call.on("stream", (userVideoStream) => {
                addVideoStream(video, userVideoStream);
                currentPeer = call.peerConnection;
            });

        });

        socket.on("user-connected", (userId) => {
            connectToNewUser(userId, stream);
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && chatInputBox.value != "") {
                socket.emit("message", chatInputBox.value);
                chatInputBox.value = "";
            }
        });

        socket.on("createMessage", (msg, username) => {
            console.log(msg);
            let li = document.createElement("li");
            if (username == user) {
                li.innerHTML = "Me: " + msg;
                li.style.textAlign = "right";
            } else {
                li.innerHTML = username + ": " + msg;
            }

            all_messages.append(li);
            main__chat__window.scrollTop = main__chat__window.scrollHeight;
        });
    });

socket.on('user-disconnected', userId => {
    if (peers[userId]) {
        peers[userId].close();
    }
})

peer.on("open", (id) => {
    socket.emit("join-room", ROOM_ID, id, user);
});

peer.on("call", function (call) {
    getUserMedia(
        { video: true, audio: true },
        function (stream) {
            call.answer(stream); // Answer the call with an A/V stream.
            const video = document.createElement("video");
            call.on("stream", function (remoteStream) {
                addVideoStream(video, remoteStream);
                currentPeer = call.peerConnection;
            });
        },
        function (err) {
            console.log("Failed to get local stream", err);
        }
    );
});


//INVITE
const inviteButton = document.querySelector("#inviteButton");
inviteButton.addEventListener("click", (e) => {
    prompt(
        "Copy this link and send it to people you want to meet with",
        window.location.href
    );
});

// CHAT

const connectToNewUser = (userId, streams) => {
    var call = peer.call(userId, streams);
    console.log(call);
    var video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
        console.log(userVideoStream);
        addVideoStream(video, userVideoStream);
    });

    currentPeer = call.peerConnection

    call.on('close', () => {
        video.remove();
    })

    peers[userId] = call;
};

const addVideoStream = (videoEl, stream) => {
    console.log(stream);
    videoEl.srcObject = stream;
    videoEl.title = user;
    videoEl.addEventListener("loadedmetadata", () => {
        videoEl.play();
    });

    videoGrid.append(videoEl);

    let totalUsers = document.getElementsByTagName("video").length;
    if (totalUsers > 1) {
        for (let index = 0; index < totalUsers; index++) {
            document.getElementsByTagName("video")[index].style.width =
                100 / totalUsers + "%";
        }
    }

    
};

const playStop = () => {
    let enabled = myVideoStream.getVideoTracks()[0].enabled;

    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo();
    } else {

        setStopVideo();
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
};

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
};

const setPlayVideo = () => {
    const html = `<i class="unmute fa fa-pause-circle"></i>
    <span class="unmute">Resume Video</span>`;
    document.getElementById("playPauseVideo").innerHTML = html;
};

const setStopVideo = () => {
    const html = `<i class=" fa fa-video-camera"></i>
    <span class="">Pause Video</span>`;
    document.getElementById("playPauseVideo").innerHTML = html;
};

const setUnmuteButton = () => {
    const html = `<i class="unmute fa fa-microphone-slash"></i>
    <span class="unmute">Unmute</span>`;
    document.getElementById("muteButton").innerHTML = html;
};
const setMuteButton = () => {
    const html = `<i class="fa fa-microphone"></i>
    <span>Mute</span>`;
    document.getElementById("muteButton").innerHTML = html;
};

const showChat = () => {
    let elem1 = document.querySelector(".main__right");
    let elem2 = document.querySelector(".main__left");

    if (elem1.style.display == "none") {
        elem2.style.flex = 0.8;
        elem1.style.flex = 0.2;
        elem1.style.display = "flex";
    }
    else {
        elem2.style.flex = 1.0;
        elem1.style.flex = 0.0;
        elem1.style.display = "none";
    }

}

document.querySelector('#share__Btn').addEventListener("click", (e) => {
    let count = document.querySelectorAll("#sharescreen").length;
    if (count == 0) {
        navigator.mediaDevices.getDisplayMedia({ 
            video:{
                cursor: "always"
            },
            audio:{
                echoCancellation : true,
                noiseSuppression: true
            }
         }).then(stream => {
            let videoTrack = stream.getVideoTracks()[0];
            videoTrack.onended = () =>{
                stopScreenShare();
            }
            let sender = currentPeer.getSenders().find(function(s){
                return s.track.kind == videoTrack.kind
            });

            sender.replaceTrack(videoTrack);
        })
    }
    else {
        alert('Someone is already presenting.')
    }
});

const stopScreenShare = () =>{
    let videoTrack = myVideoStream.getVideoTracks()[0];
    var sender = currentPeer.getSenders().find(function(s){
        return s.track.kind == videoTrack.kind;
    })

    sender.replaceTrack(videoTrack);
}
// const shareScreen = (userId, username, stream) => {
//     var call = peer.call(userId, stream);

//     call.on("stream", (userVideoStream) => {
//         startScreenShare(userVideoStream,username);
//     });

//     call.on('close', () => {
//         video.remove();
//     })

//     peers[userId] = call;
// };

// const startScreenShare = (stream,username) => {
//     alert(`${username} has started screen sharing.`)
//     const screenTrack = stream.getTracks()[0];
//     let div = document.createElement('div');
//     div.id = 'sharescreen';
//     div.classList.add('sharescreen');
//     var video = document.createElement("video");
//     video.srcObject = stream;
//     video.controls = true;
//     video.autoplay = true;

//     div.appendChild(video);
//     let grid = document.getElementById('video-grid');
//     grid.append(div);

//     screenTrack.onended = function () {
//         div.remove();
//     }

// }

// function shareScreen() {
//     navigator.mediaDevices.getDisplayMedia({ cursor: true }).then(stream => {
//         const screenTrack = stream.getTracks()[0];
//         let count = document.querySelectorAll("#sharescreen").length;
//         if (count == 0) {
//             console.log(stream);
//             let div = document.createElement('div');
//             div.id = 'sharescreen';
//             div.classList.add('sharescreen');
//             let video = document.createElement('video');
//             video.srcObject = stream;
//             video.controls = true;
//             video.autoplay = true;

//             div.appendChild(video);
//             let grid = document.getElementById('video-grid');
//             grid.append(div);

//             screenTrack.onended = function () {
//                 div.remove();
//             }
//         }
//         else {
//             alert('Someone is already presenting.')
//         }

//         // senders.current.find(sender => sender.track.kind === 'video').replaceTrack(screenTrack);
//         // screenTrack.onended = function () {
//         //     senders.current.find(sender => sender.track.kind === "video").replaceTrack(userStream.current.getTracks()[1]);
//         // }
//     })
// }

const close_window = () => {
    if (confirm("Leave Meeting?")) {
        window.open("http://left-meeting.com", "_self");
    }
}
console.log("Refreshed");