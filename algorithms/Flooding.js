const { xml } = require('@xmpp/client');

let receivedMessages = new Set();

/**
 * Sends a message to all neighboring nodes using the Flooding algorithm.
 * 
 * @param {Object} xmpp - The XMPP client instance.
 * @param {string} from - The JID of the node sending the message.
 * @param {string} to - The JID of the target node (can be null for flooding).
 * @param {string} payload - The actual content/message to send.
 * @param {number} hops - The number of hops remaining before the message should be discarded.
 * @param {Object} neighbors - A map of neighboring nodes and their associated details.
 */
function sendFloodingMessage(xmpp, from, to, payload, hops, neighbors) {
    Object.keys(neighbors).forEach((neighbor) => {
        if (neighbor !== from && hops > 0) {
            const message = {
                type: "flooding",                       
                from: from,                             
                to: neighbors[neighbor].jid,            
                hops: hops,                             
                payload: payload                        
            };

            console.log(`\nSending to neighbor: ${neighbors[neighbor].jid}`);

            // Send the message to each neighbor using XMPP
            xmpp.send(xml(
                'message',                                  
                { to: message.to },                         
                xml('body', {}, JSON.stringify(message))    
            ));
        }
    });
}

function triggerFloodingAction(xmpp, neighbors) {
    const from = xmpp.jid.toString();
    const payload = "Triggered Flooding Message!";
    const hops = 3;

    sendFloodingMessage(xmpp, from, null, payload, hops, neighbors);
}

/**
 * Handles incoming messages received by the node using the Flooding algorithm.
 * 
 * @param {Object} stanza - The XMPP stanza (message) received.
 * @param {Object} xmpp - The XMPP client instance.
 * @param {Object} neighbors - A map of neighboring nodes and their associated details.
 */
function handleFloodingMessage(stanza, xmpp, neighbors) {
    const message = JSON.parse(stanza.getChild("body").text());
    const messageId = `${message.from}-${message.payload}`;

    if (receivedMessages.has(messageId)) {
        console.log("Message already received, skipping...");
        return;
    }

    receivedMessages.add(messageId);

    console.log(`\nFlooding message received from ${message.from} with payload: "${message.payload}" and hops remaining: ${message.hops}`);

    if (message.hops > 0) {
        console.log(`Propagating message to neighbors...`);
        sendFloodingMessage(xmpp, message.from, message.to, message.payload, message.hops - 1, neighbors);
    } else {
        console.log(`Message received at final destination or hops exhausted: ${message.payload}`);
    }
}

// Export functions to be used in other modules
module.exports = {
    triggerFloodingAction,
    handleFloodingMessage
};