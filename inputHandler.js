const readline = require("readline");
const fs = require("fs");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const nodes = JSON.parse(fs.readFileSync("./maps/nodes.json", "utf8"));

const getNodeCredentials = (callback) => {
  rl.question(
    "Please enter the node you would like to use (e.g., A, B, C, D, E): ",
    (node) => {
      const nodeData = nodes.nodes[node];
      if (nodeData) {
        callback(null, nodeData);
      } else {
        console.error(
          "Invalid node selection. Please restart the program and select a valid node."
        );
        rl.close();
        process.exit(1);
      }
    }
  );
};

const promptForAction = (callback) => {
  rl.question(
    'Please enter the command (e.g., "flood" or "lsr" to trigger the corresponding algorithm): ',
    (action) => {
      callback(action);
    }
  );
};

module.exports = { getNodeCredentials, promptForAction };
