/*
  Laboratorio 3 - Redes
  Distance vector routing
*/

// Algorithm to calculate the distance vector routing
const distanceVectorRouting = (neighborTables, sourceNode, destinationNode) => {
  // Inicializar las distancias y los caminos
  let distances = {};
  let nextHop = {};

  // Establecer la distancia a sí mismo como 0
  distances[sourceNode] = 0;
  nextHop[sourceNode] = sourceNode;

  // Inicializar las distancias desde el nodo fuente a sus vecinos
  for (let neighbor in neighborTables[sourceNode]) {
    distances[neighbor] = neighborTables[sourceNode][neighbor];
    nextHop[neighbor] = neighbor;
  }

  let updated;

  // Iterar hasta que no haya más actualizaciones
  do {
    updated = false;

    // Iterar sobre todos los nodos en la tabla
    for (let node in neighborTables) {
      // Ignorar si no hay camino conocido al nodo
      if (!distances[node]) continue;

      // Revisar todos los vecinos del nodo
      for (let neighbor in neighborTables[node]) {
        // Calcular la nueva distancia posible
        let newDist = distances[node] + neighborTables[node][neighbor];

        // Si la nueva distancia es menor, actualizar la tabla
        if (!distances[neighbor] || newDist < distances[neighbor]) {
          distances[neighbor] = newDist;
          nextHop[neighbor] = nextHop[node];
          updated = true;
        }
      }
    }
  } while (updated);

  // Devolver el siguiente salto hacia el nodo de destino
  return nextHop[destinationNode] || null;
};

const findDestination = (sourceNode, destinationNode, neighborTables) => {
  let currentNode = sourceNode;

  let nextHop = distanceVectorRouting(
    neighborTables,
    sourceNode,
    destinationNode
  );

  const hops = [{ currentNode, nextHop }];

  // iterate every next hop to reach the destination node
  while (true) {
    // console.log(`Next hop from ${currentNode} is ${nextHop}`);
    currentNode = nextHop;
    nextHop = distanceVectorRouting(
      neighborTables,
      currentNode,
      destinationNode
    );

    if (currentNode === destinationNode) {
      // console.log(`Reached destination node: ${destinationNode}`);
      break;
    }

    hops.push({ currentNode, nextHop });
  }

  return hops;
};

// example of neighbor tables
let neighborTables = {
  A: { B: 1, C: 4 },
  B: { A: 1, C: 2, D: 5, E: 3 },
  C: { A: 4, B: 2, D: 1, E: 2 },
  D: { B: 5, C: 1, E: 1 },
  E: { B: 3, C: 2, D: 1 },
};

const hops = findDestination("A", "D", neighborTables);
console.log("hops:", hops);
