const { client, xml } = require('@xmpp/client');



const jid = 'foo@alumchat.lol/a1b2c3';
const username = 'foo@alumchat.lol';
const password = 'yourpassword';

// Initialize the XMPP client with account details
const xmpp = client({
    service: 'ws://alumchat.lol:7070/ws/',
    domain: 'alumchat.lol',
    resource: 'a1b2c3',
    username: username,
    password: password,
});

let neighbors = {}; // Mapa de vecinos con sus costos
let routingTable = {}; // Tabla de enrutamiento

xmpp.on('stanza', (stanza) => {
    if (stanza.is('message')) {
        // Parse the message to determine its type
        const message = JSON.parse(stanza.getChild("body").text());

        if (message.type === "flooding") {
            handleFloodingMessage(stanza, xmpp, neighbors);
        } else if (message.type === "linkstate") {
            handleLinkStateMessage(stanza, xmpp, neighbors);
        } else {
            console.log(`Unknown message type: ${message.type}`);
        }
    }
});

xmpp.on('error', (err) => {
    console.error(err);
});

// Función para inicializar la conexión XMPP
xmpp.start().catch(console.error);