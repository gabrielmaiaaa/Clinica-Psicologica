const mqtt = require('mqtt');
const client = mqtt.connect('wss://test.mosquitto.org:8081');

const gravidade = 'grave';

client.on('connect', () => {
    console.log('Conectado ao broker');
    client.subscribe('relatos/enviar'); // topico conectado
});

client.on('message', (topico, message) => {
    if (topico === 'relatos/enviar') { // verifica se a mensagem é desse tópico
        const relato = JSON.parse(message.toString());
        
        if(gravidade === 'grave'){
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
