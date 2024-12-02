const express = require('express'); 
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const router = express.Router();

//Conexao com banco de dados
const bdPath = path.join(__dirname,'..','db','consulta.json');
const consultasDB = JSON.parse(fs.readFileSync(bdPath, {encoding: 'utf-8'}));

const Consulta = require('../models/Consulta');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: process.env.email,
        pass: process.env.senha,
    },
})

const enviarNotificacao = async (destinatario, assunto, conteudoHTML) => {
    try {
        const info = await transporter.sendMail({
            from: '"Clinica Psicologa" <gabrielmaia6743@gmail.com>',
            to: destinatario,
            subject: assunto,
            html: conteudoHTML,
        });
        console.log(`Notificação enviada: ${info.messageId}`);
    } catch (error) {
        console.error('Erro ao enviar notificação:', error.message);
        throw new Error('Erro ao enviar notificação.');
    }
};

router.get('/consultas', (req, res) => {
    res.status(200).json(consultasDB);
})

router.put('/atualizarConsulta', async (req, res) => {
    // permitir atualizar data de uma consulta (verificando se já existe uma e permitindo somente o psicologo alterar data que tem conflito)
    const {id, paciente, data, horario, prioridade, novaData, novoHorario} = req.body;
    
    let index = consultasDB.findIndex(usuario => usuario.id === id);

    if (index === -1) {
        return res.status(404).send('Consulta não encontrada.');
    }

    // verificar se está antecipando a data de uma consulta pois tem uma alta prioridade (psicologo recebeu um relato de alta prioridade)
    if (prioridade) {
        // Verifica se já existe uma consulta no novo horário e data
        const consultaConflito = consultasDB.find(consulta => consulta.data === novaData && consulta.horario === novoHorario);

        if (consultaConflito && consultaConflito.gravidade !== 'grave') {
            let index2 = consultasDB.findIndex(consulta => consulta.id === consultaConflito.id);
            if (index2 !== -1) {
                try{
                // Realoca a consulta que estava no horário para a data do paciente alterado
                consultasDB[index2].data = data;
                consultasDB[index2].horario = horario;

                // Atualiza a consulta do paciente para a nova data e horário
                consultasDB[index].data = novaData;
                consultasDB[index].horario = novoHorario;

                // Envia notificações de alteração
                await notificarPacienteAlteracaoConsulta(consultaConflito);
                await notificarPacienteAlteracaoConsulta(consultasDB[index]);

                // salvar dados
                fs.writeFileSync(bdPath, JSON.stringify(consultasDB, null, 2));
                return res.status(200).send('Consulta de alta prioridade cadastrada com sucesso e consulta alterada');
                } catch (error) {
                    return console.error('Erro ao processar mensagem:', error);
                }
            }
        } else if (consultaConflito) {
            return res.status(422).send('Alteração impossibilitada, pois existe uma consulta de alta prioridade no novo horário.');
        }
    } else{       
        try{      
        // caso a consulta que está sendo alterada não é de alta prioridade (paciente solicitou uma nova data pq n podia a antiga)
        const consultaConflito = consultasDB.some(consulta => consulta.data === novaData && consulta.horario === novoHorario);

        if (consultaConflito) {
            return res.status(422).send('Alteração impossibilitada, pois já existe uma consulta neste horário.');
        }

        // alterar data da consulta
        consultasDB[index].data = novaData;
        consultasDB[index].horario = novoHorario;

        // Envia notificações de alteração
        await notificarPacienteAlteracaoConsulta(consultasDB[index]);

        // salvar dados
        fs.writeFileSync(bdPath,JSON.stringify(consultasDB,null,2));
        return res.status(200).send('Consulta cadastrada com sucesso');
        } catch (error) {
            return console.error('Erro ao processar mensagem:', error);}
    }
});

module.exports = router;