const { client } = require("@xmpp/client");
const {
  triggerFloodingAction,
  handleFloodingMessage,
} = require("./algorithms/Flooding");
const { triggerLSRAction, handleLSRMessage } = require("./algorithms/LSR");
const { getNodeCredentials, promptForAction } = require("./inputHandler");

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

  xmpp.on("stanza", (stanza) => {
    if (stanza.is("message")) {
      // Parse the message to determine its type
      const message = JSON.parse(stanza.getChild("body").text());

      if (message.type === "flooding") {
        handleFloodingMessage(stanza, xmpp, neighbors);
      } else if (message.type === "lsr") {
        handleLSRMessage(stanza, xmpp, routingTable);
      } else {
        console.log(`Unknown message type: ${message.type}`);
      }
    }
  });

  xmpp.on("error", (err) => {
    console.error(err);
  });

  xmpp.start().catch(console.error);
});
