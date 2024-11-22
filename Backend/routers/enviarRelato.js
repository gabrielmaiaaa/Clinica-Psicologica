const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');

const bdPath = path.join(__dirname, '..', 'db', 'relato.json');
const relatosBD = JSON.parse(fs.readFileSync(bdPath, {encoding: 'utf-8'}));

const client = mqtt.connect('wss://test.mosquitto.org:8081');

const gravidade = 'grave';

client.on('connect', () => {
    console.log('Conectado ao broker');
    client.subscribe('relatos/enviar'); // tópico conectado
});

client.on('message', (topico, message) => {
    if (topico === 'relatos/enviar') { 
        const relato = JSON.parse(message.toString());

        //Salva user no "banco"
        relatosBD.push(relato);
        fs.writeFileSync(bdPath, JSON.stringify(relatosBD, null, 2));

        if (gravidade === 'grave') {
            client.publish(
                'relatos/notificar',
                JSON.stringify({ userId: relato.userId, text: relato.text, gravidade }),
                () => {
                    console.log(`Relato analisado e enviado: ${relato.userId} com gravidade de ${gravidade}`);
                }
            );
        }
    }
});
