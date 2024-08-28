/**
 * @author Daniel Gomez 21429
 * @author Fabian Juarez
 * @author Diego Lemus
 */

// Dijkstra's algorithm for Link State Routing
function linkStateRouting(source) {
  const distances = {};
  const previous = {};
  const nodes = new Set(Object.keys(networkTopology));

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
    for (let [neighbor, cost] of Object.entries(networkTopology[closestNode])) {
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
function findBestNeighbor(source, destination) {
  const { distances, previous } = linkStateRouting(source);
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
function findDestination(source, destination) {
  const { distances, previous } = linkStateRouting(source);
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

// Example usage
console.log(findDestination("A", "E"));
