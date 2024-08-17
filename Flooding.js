
//Implementing Flooding

function sendFloodingMessage(xmpp, payload, hops, neighbors){
    const message = {

    }
    xmpp.send(message);
}

function handleFloodingMessage(stanza, xmpp, neighbors){
    const message = JSON.parse(stanza.getChild("body").text());
    if (message.hops > 0){
        Object.keys(neighbors).forEach((neighbor) => {
            if (neighbor!== messages.from){
            sendFloodingMessage(xmpp, message.payload, message.hops -1, neighbors);
            }
        });
    }
}