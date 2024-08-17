const { client, xml } = require('@xmpp/client');



const jid = 'foo@alumchat.lol/a1b2c3'; // Reemplaza con tu JID
const username = 'foo@alumchat.lol';
const password = 'yourpassword'; // Reemplaza con tu contraseña

const xmpp = client({
    service: 'ws://alumchat.lol:7070/ws/',
    domain: 'alumchat.lol',
    resource: 'a1b2c3',
    username: username, // nombre de usuario
    password: password, //contraseña
});

let neighbors = {}; // Mapa de vecinos con sus costos
let routingTable = {}; // Tabla de enrutamiento

// Función para inicializar la conexión XMPP
xmpp.start().catch(console.error);