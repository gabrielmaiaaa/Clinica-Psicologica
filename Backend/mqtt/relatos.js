const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const language = require('@google-cloud/language');

const bdPath = path.join(__dirname, '..', 'db', 'relato.json');
const relatosBD = JSON.parse(fs.readFileSync(bdPath, {encoding: 'utf-8'}));

const client = mqtt.connect('wss://test.mosquitto.org:8081');

// Configurando as credenciais
const AI = new language.LanguageServiceClient({
    keyFilename: 'C:/Users/gmara/OneDrive/Documentos/GitHub/Clinica-Psicologica/Backend/credencial/credencial.json',
});

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

client.on('message', async (topico, message) => {
    if (topico === 'relatos/enviar') { 
        try {
            const relato = JSON.parse(message.toString());

            //Salva user no "banco"
            relatosBD.push(relato);
            fs.writeFileSync(bdPath, JSON.stringify(relatosBD, null, 2));

            // Analisar sentimento usando a API
            const document = {
                content: relato.text,
                type: 'PLAIN_TEXT',
            };

            const [result] = await AI.analyzeSentiment({ document });
            const sentiment = result.documentSentiment;
            console.log(sentiment.score);
            

            // Determinar gravidade com base no score de sentimento
            let gravidade = 'normal'; // Default
            if (sentiment.score < 0) {
                gravidade = 'grave'; // Sentimento muito negativo
            }            
            
            if (gravidade === 'grave') {
                client.publish(
                    'relatos/notificar',
                    JSON.stringify({ userId: relato.userId, text: relato.text, gravidade }),
                    () => {
                        console.log(`Relato analisado e enviado: ${relato.userId} com gravidade de ${gravidade}`);
                    }
                );
            }else {
                console.log(`Relato de ${relato.userId} cadastrado, ${relato.text}`);
                JSON.stringify({ userId: relato.userId, text: relato.text, gravidade });
            }
        } catch (error) {
            console.error("Erro ao processar mensagem:", error.message);
        }
        
    }
});
