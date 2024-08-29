const { xml } = require('@xmpp/client');

/**
 * @author Daniel Gomez 21429
 * @author Fabian Juarez 21440
 * @author Diego Lemus 21469
 */

//Implementing Flooding

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
    // Loop through each neighbor and send the message if it hasn't been sent from that neighbor
    Object.keys(neighbors).forEach((neighbor) => {
        
        const message = {
            type: "flooding",                       // Message type is 'Flooding' message
            from: from,                             // Sender's JID
            to: neighbors[neighbor].jid,            // Target recipient's JID
            hops: hops,                             // Remaining number of hops before the message is discarded
            payload: payload                        // The actual message content
        };

        if (neighbor !== from) {
            // Send the message to each neighbor using XMPP
            xmpp.send(xml(
                'message',                                  // XMPP message stanza
                { to: message.to },                         // Send to the neighbor's JID
                xml('body', {}, JSON.stringify(message))    // Convert the message object to a JSON string
            ));
        }
    });
}

function triggerFloodingAction(xmpp, neighbors) {
    const from = xmpp.jid.toString(); // The JID of the sender
    const payload = "Triggered Flooding Message!"; // The message content
    const hops = 3; // Number of hops for the message

    // Call the sendFloodingMessage function to initiate Flooding
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
    // Parse the incoming message from JSON
    const message = JSON.parse(stanza.getChild("body").text());

    console.log(`Flooding message received from ${message.from} with payload: "${message.payload}" and hops remaining: ${message.hops}`);

    // Check if the message can still be propagated (hops > 0)
    if (message.hops > 0) {
        console.log(`Propagating message to neighbors...`);
        // Loop through each neighbor to propagate the message further
        Object.keys(neighbors).forEach((neighbor) => {
            // Avoid sending the message back to the sender
            if (neighbor !== message.from) {
                console.log(`Sending to neighbor: ${neighbor}`);
                // Send the message to each neighbor with one less hop
                sendFloodingMessage(xmpp, message.to, neighbor, message.payload, message.hops - 1, neighbors);
            }
        });
    } else {
        // If hops = 0, the message is received by the final node
        console.log(`Message received at ${message.to} (final destination): ${message.payload}`);
    }
}

// Export functions to be used in other modules
module.exports = {
    triggerFloodingAction,
    handleFloodingMessage
};