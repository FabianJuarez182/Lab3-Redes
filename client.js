const { client, xml } = require("@xmpp/client");
const { triggerLSRAction, handleLSRMessage } = require("./algorithms/LSR");
const { getNodeCredentials, promptForAction } = require("./inputHandler");

const {
    triggerFloodingAction,
    handleFloodingMessage,
} = require("./algorithms/Flooding");

let xmpp;
let neighbors = {
    neighbor1: { jid: "lem21469-test@alumchat.lol/a1b2c3" },
    neighbor2: { jid: "neighbor2@alumchat.lol/a1b2c3" },
};

let routingTable = {
    "gom21429@alumchat.lol/a1b2c3": {
        "jdgomezv1@alumchat.lol/a1b2c3": 1,
        "jdgomezv2@alumchat.lol/a1b2c3": 2,
    },
    "jdgomezv1@alumchat.lol/a1b2c3": {
        "jdgomezv2@alumchat.lol/a1b2c3": 1,
        "jdgomezv3@alumchat.lol/a1b2c3": 3,
    },
    "jdgomezv2@alumchat.lol/a1b2c3": {
        "jdgomezv1@alumchat.lol/a1b2c3": 2,
        "jdgomezv3@alumchat.lol/a1b2c3": 3,
    },
    "jdgomezv3@alumchat.lol/a1b2c3": {
        "jdgomezv1@alumchat.lol/a1b2c3": 2,
        "jdgomezv2@alumchat.lol/a1b2c3": 3,
    },
};

getNodeCredentials((err, nodeData) => {
    if (err) {
        console.error(err.message);
        return;
    }

    const username = nodeData.user;
    const password = nodeData.pass;

    xmpp = client({
        service: "ws://alumchat.lol:7070/ws/",
        domain: "alumchat.lol",
        resource: "a1b2c3",
        username: username.split("@")[0],
        password: password,
    });

    // Initialize XMPP client
    xmpp.on("online", async (address) => {

        console.log(`Connected as ${address.toString()}`);

        const presence = xml('presence');
        xmpp.send(presence);

        promptForAction((action) => {

            if (action === "flood") {
                triggerFloodingAction(xmpp, neighbors);

            } else if (action === "lsr") {
                // Agregar llamada a LSR
                triggerLSRAction(xmpp, routingTable);

            } else {
                console.log(`Unknown command: ${action}`);
            }
        });
    });

    xmpp.on('stanza', async (stanza) => {
        if (stanza.is('message')) {
            const body = stanza.getChild('body');
            if (body) {
                const message = JSON.parse(body.text());
                if (message.type === "flooding") {
                    handleFloodingMessage(stanza, xmpp, neighbors);
                } else if (message.type === "linkstate") {
                    handleLinkStateMessage(stanza, xmpp, neighbors);
                } else {
                    console.log(`Unknown message type: ${message.type}`);
                }
            }
        }
    });

    xmpp.on("error", (err) => {
        console.error(err);
    });

    xmpp.start().catch(console.error);

    // Handle close event
    function cleanUpAndExit() {
        xmpp.stop().then(() => {
            console.log('XMPP client disconnected gracefully.');
            process.exit(0); // Exit the process when XMPP client has disconnected
        }).catch((err) => {
            console.error('Error while disconnecting XMPP client:', err);
            process.exit(1); // Exit with error code if disconnection fails
        });
    }

    process.on('SIGINT', cleanUpAndExit); // Handle ctrl+c event
    process.on('SIGTERM', cleanUpAndExit); // Handle kill command
    process.on('exit', cleanUpAndExit); // Handle normal exit
});
