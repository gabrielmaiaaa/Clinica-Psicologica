const mqtt = require('mqtt');
const nodemailer = require('nodemailer');
require('dotenv').config();

const client = mqtt.connect('wss://test.mosquitto.org:8081');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: process.env.email,
        pass: process.env.senha,
    },
})

const notificarPsicologo = async (relato) => {
    const info = await transporter.sendMail({
        from: '"Central de Relatos" <gabrielmaia6743@gmail.com>',
        to: 'gabrielmaia6743@gmail.com', 
        subject: `Novo relato com alta prioridade: ${relato.gravidade}`,
        text: `Novo relatorio recebido do ${relato.userId}, marcar uma nova consulta o quanto antes`,
        html: `
            <h1>Novo Relato Recebido</h1>
            <p>Usuário: ${relato.userId}</p>
            <p>Gravidade: ${relato.gravidade}</p>
            <p>Mensagem: ${relato.text}</p>
        `,
    })
    console.log(`Notificação enviada: ${info.messageId}`);
}

client.on('connect', () => {
    console.log('Conectado ao broker MQTT');
    client.subscribe('relatos/notificar', (error) => {
        if (error) {
            console.error('Erro ao se inscrever no tópico:', error);
        } else {
            console.log('Inscrito no tópico "relatos/notificar"');
        }
    });
})

client.on('message', async (topico, message) => {
    if (topico === 'relatos/notificar') {
        try {
            const relato = JSON.parse(message.toString());
            console.log(`Relato recebido de ${relato.userId} com gravidade de ${relato.gravidade}`);
            console.log('Notificar psicólogo...');
            await notificarPsicologo(relato);
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
        }
    }
})