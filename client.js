const { client } = require('@xmpp/client');
const { triggerFloodingAction, handleFloodingMessage } = require('./algorithms/Flooding');
const { getNodeCredentials } = require('./inputHandler');

getNodeCredentials((err, nodeData) => {
    if (err) {
        console.error(err.message);
        return;
    }

    const username = nodeData.user;
    const password = nodeData.pass;

    const xmpp = client({
        service: 'ws://alumchat.lol:7070/ws/',
        domain: 'alumchat.lol',
        resource: 'a1b2c3',
        username: username.split('@')[0], // Asumiendo que el usuario es 'nombre@dominio'
        password: password,
    });

    let neighbors = {
        neighbor1: { jid: 'lem21469-test@alumchat.lol/a1b2c3' },
        neighbor2: { jid: 'neighbor2@alumchat.lol/a1b2c3' }
    };
    let routingTable = {}; // Tabla de enrutamiento

    // Event listener for when the client connects to the server
    xmpp.on('online', async (address) => {
        console.log(`Connected as ${address.toString()}`);
        
    });


    // Listen for standard input from the terminal (e.g., typing 'flood' to trigger the Flooding)
    process.stdin.on('data', (data) => {
        const input = data.toString().trim();

        if (input === 'flood') {
            // Trigger the Flooding action
            triggerFloodingAction(xmpp, neighbors);
        }
    });

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

});