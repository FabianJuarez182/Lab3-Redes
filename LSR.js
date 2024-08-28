/**
 * @author Daniel Gomez 21429
 * @author Fabian Juarez
 * @author Diego Lemus
 */

// Dijkstra's algorithm for Link State Routing
function linkStateRouting(source, networkTopology) {
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
function findBestNeighbor(source, destination, networkTopology) {
  const { distances, previous } = linkStateRouting(source, networkTopology);
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
function findDestination(source, destination, networkTopology) {
  const { distances, previous } = linkStateRouting(source, networkTopology);
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

// Neighbor tables (network topology)
const networkTopology = {
  A: { B: 1, C: 4 },
  B: { A: 1, C: 2, D: 5, E: 3 },
  C: { A: 4, B: 2, D: 1, E: 2 },
  D: { B: 5, C: 1, E: 1 },
  E: { B: 3, C: 2, D: 1 },
};

// Example usage
console.log(findDestination("A", "E", networkTopology));
