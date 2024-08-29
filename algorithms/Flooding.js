const { xml } = require('@xmpp/client');

let receivedMessages = new Set();

/**
 * Sends a message to all neighboring nodes using the Flooding algorithm.
 * 
 * @param {Object} xmpp - The XMPP client instance.
 * @param {string} from - The JID of the node sending the message.
 * @param {string} payload - The actual content/message to send.
 * @param {number} hops - The number of hops remaining before the message should be discarded.
 * @param {Object} neighbors - A map of neighboring nodes and their associated details.
 */
function sendFloodingMessage(xmpp, from, payload, hops, neighbors) {
    Object.keys(neighbors).forEach((neighbor) => {
        if (neighbor !== from && hops > 0) {
            const message = {
                type: "flooding",                       
                from: from,                             
                to: neighbors[neighbor].jid,            
                hops: hops,                             
                payload: payload                        
            };

            console.log(`Sending to neighbor: ${neighbors[neighbor].jid}`);

            // Send the message to each neighbor using XMPP
            xmpp.send(xml(
                'message',                                  
                { to: message.to },                         
                xml('body', {}, JSON.stringify(message))    
            ));
        }
    });
}

function triggerFloodingAction(xmpp, neighbors, payload, hops) {
    const from = xmpp.jid.toString();

    sendFloodingMessage(xmpp, from, payload, hops, neighbors);
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

    // If the message was originated by this node, ignore it to avoid loops
    if (message.from === xmpp.jid.toString() || receivedMessages.has(messageId)) {
        console.log("Message already received or originated from this node, skipping...");
        return;
    }

    receivedMessages.add(messageId);

    // Decrement the hops before propagating
    const remainingHops = message.hops - 1;

    if (remainingHops > 0) {
        console.log(`Flooding message received from ${message.from} with payload: "${message.payload}" and hops remaining: ${remainingHops}\n`);
        console.log(`Propagating message to neighbors...`);
        sendFloodingMessage(xmpp, message.from, message.payload, remainingHops, neighbors);
    } else {
        // When hops decrement to zero, indicate that the transmission stops here
        console.log(`Flooding message received from ${message.from} with payload: "${message.payload}" but no hops remain. Transmission stops here.`);
    }
}

// Export functions to be used in other modules
module.exports = {
    triggerFloodingAction,
    handleFloodingMessage
};
