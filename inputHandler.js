const readline = require('readline');
const fs = require('fs');

// Función para obtener las credenciales del nodo
const getNodeCredentials = (callback) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

        const nodes = JSON.parse(fs.readFileSync('./maps/nodes.json', 'utf8'));

    rl.question('Please enter the node you would like to use (A, B, C, D, E): ', (node) => {
        const nodeData = nodes.nodes[node];
        rl.close();
        if (nodeData) {
            callback(null, nodeData);
        } else {
            callback(new Error('Invalid node selection. Please restart the program and select a valid node.'));
        }
    });
};

module.exports = { getNodeCredentials };
