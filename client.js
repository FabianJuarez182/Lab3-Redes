const { client, xml } = require("@xmpp/client");
const { triggerLSRAction, handleLSRMessage, nodeToJid, printRoutingTable  } = require("./algorithms/LSR");
const {
  getNodeCredentials,
  promptForAction,
  askForRole,
  askForHops,
  askForPayload,
  rl,
} = require("./inputHandler");
const {
  triggerFloodingAction,
  handleFloodingMessage,
} = require("./algorithms/Flooding");
const fs = require("fs");

let xmpp;

const floodRoutes = JSON.parse(
  fs.readFileSync("./maps/test.json", "utf8")
).routes;
const nodes = JSON.parse(fs.readFileSync("./maps/nodes.json", "utf8")).nodes;

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

    const presence = xml("presence");
    xmpp.send(presence);

    promptForAction(({ action}) => {
      if (action === "flood") {
        askForRole((role) => {
          if (role === "1") {
            console.log("\nYou are functioning as a sender.\n");

            const currentNodeTag = nodeData.tag;
            const nodeRoutes = floodRoutes[currentNodeTag];

            if (!nodeRoutes) {
              console.error(
                `No routes found for node ${currentNodeTag}. Please check test.json.`
              );
              process.exit(1);
            }

            askForPayload((payload) => {
              askForHops((hops) => {
                const neighbors = nodeRoutes.reduce((acc, route) => {
                  const neighborNodeTag = route.path;
                  const neighborUser = nodes[neighborNodeTag].user;
                  acc[neighborNodeTag] = { jid: `${neighborUser}/a1b2c3` };
                  return acc;
                }, {});

                triggerFloodingAction(xmpp, neighbors, payload, hops);
              });
            });
          } else if (role === "2") {
            console.log(
              "\nYou are functioning as a receiver. Listening for messages...\n"
            );
            // The handleFloodingMessage will be triggered upon receiving a message stanza.
          } else {
            console.log(`Unknown role: ${role}`);
          }
        });
      } else if (action === "lsr") {
          // Imprimir la tabla de enrutamiento antes de solicitar el nodo destino
          printRoutingTable(nodeData.tag);

          // Preguntar por el nodo destino
          rl.question("Please enter the destination node (A, B, C, D, E, F): ", (destination) => {
              triggerLSRAction(xmpp, nodeToJid(destination.trim().toUpperCase()));
          });
      } else {
        console.log(`Unknown command: ${action}`);
      }
    });
  });

  xmpp.on("stanza", async (stanza) => {
    if (stanza.is("message")) {
      const body = stanza.getChild("body");
      if (body) {
        const message = JSON.parse(body.text());
        if (message.type === "flooding") {
          const currentNodeTag = nodeData.tag;
          const nodeRoutes = floodRoutes[currentNodeTag];

          const neighbors = nodeRoutes.reduce((acc, route) => {
            const neighborNodeTag = route.path;
            const neighborUser = nodes[neighborNodeTag].user;
            acc[neighborNodeTag] = { jid: `${neighborUser}/a1b2c3` };
            return acc;
          }, {});

          handleFloodingMessage(stanza, xmpp, neighbors);
        } else if (message.type === "lsr") {
          handleLSRMessage(stanza, xmpp);
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
    xmpp
      .stop()
      .then(() => {
        console.log("XMPP client disconnected gracefully.");
        process.exit(0); // Exit the process when XMPP client has disconnected
      })
      .catch((err) => {
        console.error("Error while disconnecting XMPP client:", err);
        process.exit(1); // Exit with error code if disconnection fails
      });
  }

  process.on("SIGINT", cleanUpAndExit); // Handle ctrl+c event
  process.on("SIGTERM", cleanUpAndExit); // Handle kill command
  process.on("exit", cleanUpAndExit); // Handle normal exit
});
