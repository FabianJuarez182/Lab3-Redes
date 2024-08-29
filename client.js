process.env.node_tls_reject_unauthorized = "0";
const { client, xml } = require("@xmpp/client");
const { triggerFloodingAction, handleFloodingMessage } = require("./Flooding");
const { triggerLSRAction, handleLSRMessage } = require("./LSR");

const jid = "jdgomezv1@alumchat.lol";
const username = "jdgomezv3";
const password = "admin";

// Initialize the XMPP client with account details
const xmpp = client({
  service: "ws://alumchat.lol:7070/ws/",
  domain: "alumchat.lol",
  resource: "a1b2c3",
  username: username,
  password: password,
});

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

// Event listener for when the client connects to the server
xmpp.on("online", async (address) => {
  console.log(`Connected as ${address.toString()}`);
});

// Listen for standard input from the terminal (e.g., typing 'flood' to trigger the Flooding)
process.stdin.on("data", (data) => {
  const input = data.toString().trim();
  console.log(`Received input: ${input}`);

  switch (input) {
    case "flood":
      // Trigger the Flooding action
      triggerFloodingAction(xmpp, neighbors);
      break;
    case "lsr":
      // Trigger the Link State Routing action
      triggerLSRAction(xmpp, routingTable);
      break;
    case "exit":
      // Exit the program
      xmpp.stop();
      process.exit();
      break;
    default:
      console.log("Unknown command");
  }
});

// listen for ctrl + c to exit the program and stop the XMPP client
process.on("SIGINT", () => {
  xmpp.stop();
  process.exit();
});

xmpp.on("stanza", (stanza) => {
  if (stanza.is("message")) {
    // Parse the message to determine its type
    const message = JSON.parse(stanza.getChild("body").text());
    console.log(`Received message: ${message}`);

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
  xmpp.stop();
});

xmpp.on("offline", () => {
  console.log("offline");
  xmpp.stop();
});

// Función para inicializar la conexión XMPP
xmpp.start().catch(console.error);
