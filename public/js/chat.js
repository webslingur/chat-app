const socket = io();

// Elements
const $messageForm = document.querySelector("#chat-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $buttonDisable = document.getElementById("send-location");
const $messages = document.getElementById("messages");

// Templates
const $messageTemplate = document.getElementById("message-template").innerHTML;
const $locationTemplate = document.getElementById("location-template").innerHTML;
const $sidebarTemplate = document.getElementById("sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild;

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom, 2);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    // if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    // }
}

socket.on("message", message => {
    console.log(message);

    const html = Mustache.render(
        $messageTemplate,
        {
            username: message.username,
            message: message.text,
            createdAt: moment(message.createdAt).format("h:mm a")
        }
    );
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("locationMessage", locationMessage => {
    console.log(locationMessage);

    const html = Mustache.render(
        $locationTemplate,
        {
            username: locationMessage.username,
            url: locationMessage.url,
            createdAt: moment(locationMessage.createdAt).format("h:mm a")
        }
    );
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("roomData", ({ room, users }) => {
    console.log(room);
    console.log(users);

    const html = Mustache.render($sidebarTemplate, {
        room,
        users
    });
    document.getElementById("sidebar").innerHTML = html;
})

document.getElementById("chat-form").addEventListener("submit", (event) => {
    event.preventDefault();

    $messageFormButton.setAttribute("disabled", "disabled");

    const message = event.target.elements.message.value;
    socket.emit("sendMessage", message, (error) => {
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        }
        console.log("The message was delivered.");
    });
});

document.getElementById("send-location").addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation not supported.");
    }

    $buttonDisable.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition(position => {
        console.log(position);
        socket.emit(
            "sendLocation",
            {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            },
            (error) => {
                $buttonDisable.removeAttribute("disabled");

                if  (error) {
                    console.log(error);
                }
                console.log("Location Shared!");
            })
    });
});

socket.emit("join", { username, room }, (error) => {
    if  (error) {
        alert(error);
        location.href = "/";
    }
});

// socket.on("countUpdated", (count) => {
//     console.log(`Message received: ${count}`);
// });

// document.getElementById("increment")
//     .addEventListener("click", () => {
//         console.log("Clicked");
//         socket.emit("increment");
//     });