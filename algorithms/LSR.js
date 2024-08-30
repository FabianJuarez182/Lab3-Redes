const { xml } = require("@xmpp/client");
const fs = require("fs");

// Load the routing table and node mappings
const routingTable = JSON.parse(
  fs.readFileSync("./maps/lsr.json", "utf8")
).routes;
const nodeMappings = JSON.parse(
  fs.readFileSync("./maps/nodes.json", "utf8")
).nodes;

// Function to convert JID to node letter
function jidToNode(jid) {
  for (const [node, data] of Object.entries(nodeMappings)) {
    if (data.user === jid.split("/")[0]) {
      return node;
    }
  }
  return null;
}

// Function to convert node letter to JID
function nodeToJid(node) {
  return `${nodeMappings[node].user}/a1b2c3`;
}

// Dijkstra's algorithm for Link State Routing
function linkStateRouting(source, destination) {
  const distances = {};
  const previous = {};
  const nodes = new Set(Object.keys(routingTable));

  // Initialize distances
  for (let node of nodes) {
    distances[node] = Infinity;
    previous[node] = null;
  }
  distances[source] = 0;

  while (nodes.size > 0) {
    // Find the node with the minimum distance
    let closestNode = null;
    let shortestDistance = Infinity;
    for (let node of nodes) {
      if (distances[node] < shortestDistance) {
        closestNode = node;
        shortestDistance = distances[node];
      }
    }

    // If we can't find a node, we're done
    if (closestNode === null) break;

    nodes.delete(closestNode);

    // Update distances to the neighboring nodes
    for (let neighbor of routingTable[closestNode]) {
      let altDistance = distances[closestNode] + neighbor.cost;
      if (altDistance < distances[neighbor.path]) {
        distances[neighbor.path] = altDistance;
        previous[neighbor.path] = closestNode;
      }
    }
  }

  // Reconstruct the path
  const path = [];
  let currentNode = destination;
  while (currentNode !== null) {
    path.unshift(currentNode);
    currentNode = previous[currentNode];
  }

  return { path, totalCost: distances[destination] };
}

// Function to find the best next hop to a destination
function findBestNeighbor(source, destination) {
  const { path, totalCost } = linkStateRouting(source, destination);

  if (path.length < 2) {
    return { bestNeighbor: null, totalCost: Infinity };
  }

  return {
    bestNeighbor: path[1],
    totalCost: totalCost,
  };
}

// Function to send LSR message
function sendLSRMessage(xmpp, from, to, payload, destination) {
  const message = {
    type: "lsr",
    from: from,
    to: to,
    payload: payload,
    destination: destination,
  };

  xmpp.send(
    xml("message", { to: to }, xml("body", {}, JSON.stringify(message)))
  );
}

// Function to trigger LSR action
function triggerLSRAction(xmpp, destinationJid) {
  const fromJid = xmpp.jid.toString().split("/")[0];
  const fromNode = jidToNode(fromJid);
  const destinationNode = jidToNode(destinationJid);
  const payload = "LSR Message";

  console.log(`Sending message from ${fromNode} to ${destinationNode}`);

  if (fromNode === destinationNode) {
    console.log("Error: Destination cannot be the same as the current node\n");
    return;
  }

  const { bestNeighbor, totalCost } = findBestNeighbor(
    fromNode,
    destinationNode
  );

  if (bestNeighbor) {
    console.log(
      `Sending LSR message to ${destinationNode} via ${bestNeighbor} with total cost ${totalCost}`
    );
    const nextHopJid = nodeToJid(bestNeighbor);
    sendLSRMessage(xmpp, fromJid, nextHopJid, payload, destinationJid);
  } else {
    console.log(`No route found to ${destinationNode}`);
  }
}

// Function to handle incoming LSR messages
function handleLSRMessage(stanza, xmpp) {
  const message = JSON.parse(stanza.getChild("body").text());
  const currentJid = xmpp.jid.toString().split("/")[0];
  const currentNode = jidToNode(currentJid);
  const destinationNode = jidToNode(message.destination);

  console.log(
    `LSR message received at ${currentNode} from ${jidToNode(
      message.from
    )} with payload: "${message.payload}"`
  );

  if (currentNode === destinationNode) {
    console.log(`Message received at final destination: ${message.payload}`);
  } else {
    const { bestNeighbor, totalCost } = findBestNeighbor(
      currentNode,
      destinationNode
    );

    if (bestNeighbor) {
      console.log(
        `Forwarding LSR message from ${currentNode} to ${destinationNode} via ${bestNeighbor} with remaining cost ${totalCost}`
      );
      const nextHopJid = nodeToJid(bestNeighbor);
      sendLSRMessage(
        xmpp,
        currentJid,
        nextHopJid,
        message.payload,
        message.destination
      );
    } else {
      console.log(`No route found to ${destinationNode}`);
    }
  }
}

module.exports = {
  triggerLSRAction,
  handleLSRMessage,
};
