const { xml } = require("@xmpp/client");

/**
 * @author Daniel Gomez 21429
 * @author Fabian Juarez 21440
 * @author Diego Lemus 21469
 */

// Dijkstra's algorithm for Link State Routing
function linkStateRouting(source, routingTable) {
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
    for (let [neighbor, cost] of Object.entries(routingTable[closestNode])) {
      let altDistance = distances[closestNode] + cost;
      if (altDistance < distances[neighbor]) {
        distances[neighbor] = altDistance;
        previous[neighbor] = closestNode;
      }
    }
  }

  return { distances, previous };
}

// Function to find the best next hop to a destination
function findBestNeighbor(source, destination, routingTable) {
  // verify that the destination is on the routing table
  if (!routingTable[destination]) {
    console.log(`Destination ${destination} not found in routing table`);
    return { bestNeighbor: null, totalCost: Infinity };
  }
  const { distances, previous } = linkStateRouting(source, routingTable);
  let currentNode = destination;

  // Backtrack to find the first hop from the source
  while (previous[currentNode] !== source && previous[currentNode] !== null) {
    currentNode = previous[currentNode];
  }

  return {
    bestNeighbor: currentNode,
    totalCost: distances[destination],
  };
}

// Function to find the full path to the destination
function findDestination(source, destination, routingTable) {
  const { distances, previous } = linkStateRouting(source, routingTable);
  const path = [];
  let currentNode = destination;

  // Destination is unreachable
  if (distances[destination] === Infinity) {
    return { path: null, totalCost: Infinity };
  }

  // Reconstruct the path
  while (currentNode !== null) {
    path.unshift(currentNode);
    currentNode = previous[currentNode];
  }

  return {
    path,
    totalCost: distances[destination],
  };
}

// Function to send LSR message
function sendLSRMessage(xmpp, from, to, payload, costs, destination) {
  const message = {
    type: "lsr",
    from: from,
    to: to,
    costs: costs,
    payload: payload,
    destination: destination,
  };

  xmpp.send(
    xml("message", { to: to }, xml("body", {}, JSON.stringify(message)))
  );
}

// Function to trigger LSR action
function triggerLSRAction(xmpp, routingTable, destination) {
  const from = xmpp.jid.toString();
  const payload = "LSR Message";
  const costs = routingTable[from];
  console.log(`Sending message for: ${destination}`);

  // Choose a random destination from the routing table
  // const destinations = Object.keys(routingTable);
  // const destination = destinations[Math.floor(Math.random() * destinations.length)];

  // verify that destination is not the same as the current node
  if (destination === from) {
    console.log("Error: Destination cannot be the same as the current node\n");
    return;
  }

  const { bestNeighbor, totalCost } = findBestNeighbor(
    from,
    destination,
    routingTable
  );

  if (bestNeighbor) {
    console.log(
      `Sending LSR message to ${destination} via ${bestNeighbor} with total cost ${totalCost}`
    );
    sendLSRMessage(xmpp, from, bestNeighbor, payload, costs, destination);
  } else {
    console.log(`No route found to ${destination}`);
  }
}

// Function to handle incoming LSR messages
function handleLSRMessage(stanza, xmpp, routingTable) {
  const message = JSON.parse(stanza.getChild("body").text());
  const currentJid = xmpp.jid.toString();

  console.log(
    `LSR message received from ${message.from} with payload: "${message.payload}"`
  );

  if (message.destination === currentJid) {
    console.log(`Message received at final destination: ${message.payload}`);
  } else {
    const { bestNeighbor, totalCost } = findBestNeighbor(
      currentJid,
      message.destination,
      routingTable
    );

    if (bestNeighbor) {
      console.log(
        `Forwarding LSR message to ${message.destination} via ${bestNeighbor} with remaining cost ${totalCost}`
      );
      sendLSRMessage(
        xmpp,
        currentJid,
        bestNeighbor,
        message.payload,
        routingTable[currentJid],
        message.destination
      );
    } else {
      console.log(`No route found to ${message.destination}`);
    }
  }
}

module.exports = {
  triggerLSRAction,
  handleLSRMessage,
};
