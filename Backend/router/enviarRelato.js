const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');

const bdPath = path.join(__dirname, '..', 'db', 'relato.json');
const relatosBD = JSON.parse(fs.readFileSync(bdPath, {encoding: 'utf-8'}));

const client = mqtt.connect('wss://test.mosquitto.org:8081');

client.on('connect', () => {
    console.log('Conectado ao broker');
    client.subscribe('relatos/enviar', (error) => {
        if (error){
            console.error('Erro ao se inscrever no tópico:', error);
        } else {
            console.log('Inscrito no tópico "relatos/enviar"');
        }
    }); // tópico conectado
});

client.on('message', (topico, message) => {
    if (topico === 'relatos/enviar') { 
        try {
            const relato = JSON.parse(message.toString());

            //Salva user no "banco"
            relatosBD.push(relato);
            fs.writeFileSync(bdPath, JSON.stringify(relatosBD, null, 2));

            const gravidade = 'grave';
            if (gravidade === 'grave') {
                client.publish(
                    'relatos/notificar',
                    JSON.stringify({ userId: relato.userId, text: relato.text, gravidade }),
                    () => {
                        console.log(`Relato analisado e enviado: ${relato.userId} com gravidade de ${gravidade}`);
                    }
                );
            }
        } catch (error) {
            console.error("Erro ao processar mensagem:", error.message);
        }
        
    }
});
