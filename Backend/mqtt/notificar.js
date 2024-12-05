const mqtt = require('mqtt');
const nodemailer = require('nodemailer');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const client = mqtt.connect('mqtts://b7f0aae8c6514adeb1fb7f81c1743e30.s1.eu.hivemq.cloud:8883', {
    username: 'Gamaia',
    password: 'Maia1234'
  });

const psicologoBDPath = path.join(__dirname,'..','db','administrativo.json');
const psicologoDB = JSON.parse(fs.readFileSync(psicologoBDPath, {encoding: 'utf-8'}));

const psicologoComCip = psicologoDB.find(psicologo => psicologo.cip && psicologo.cip.trim() !== '');

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
        to: `${psicologoComCip.email}`, 
        subject: `Novo relato com alta prioridade: ${relato.gravidade}`,
        text: `Novo relato recebido do ${relato.username}, com gravidade ${relato.gravidade}. Marque uma nova consulta o quanto antes.`,
        html: `
            <h1>🚨 Novo Relato Recebido - Ação Urgente!</h1>
            <p><strong>Usuário:</strong> ${relato.username}</p>
            <p><strong>Gravidade:</strong> <span class="highlight">${relato.gravidade}</span></p>
            <div class="info">
                <p><strong>Mensagem do Usuário:</strong></p>
                <p>${relato.text}</p>
            </div>
            <h2>Instruções:</h2>
            <p>Esse relato requer atenção imediata. Recomendamos que marque uma consulta com o paciente o quanto antes para tratar a situação.</p>
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
            console.log(`Relato recebido de ${relato.username} com gravidade de ${relato.gravidade}`);
            console.log('Notificar psicólogo...');
            await notificarPsicologo(relato);
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
        }
    }
})