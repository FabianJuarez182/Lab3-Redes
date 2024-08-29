const { client } = require("@xmpp/client");
const {
  triggerFloodingAction,
  handleFloodingMessage,
  handleLinkStateMessage,
} = require("./algorithms/Flooding");
const { getNodeCredentials, promptForAction } = require("./inputHandler");

let xmpp;
let neighbors = {
  neighbor1: { jid: "lem21469-test@alumchat.lol/a1b2c3" },
  neighbor2: { jid: "neighbor2@alumchat.lol/a1b2c3" },
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
      } else if (action === "LSR") {
        // Agregar llamada a LSR
      } else {
        console.log(`Unknown command: ${action}`);
      }
    });
  });

  xmpp.on("error", (err) => {
    console.error(err);
  });

  xmpp.start().catch(console.error);
});
