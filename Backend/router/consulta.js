const express = require('express'); 
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

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

const notificarPaciente = async (consulta) => {
    const info = await transporter.sendMail({
        from: '"Clinica Psicologa" <gabrielmaia6743@gmail.com>',
        to: 'gabrielmaia6743@gmail.com', 
        subject: `Nova data de consulta ${consulta.data}`,
        text: `Nova consulta marcada para você!`,
        html: `
            <h1>Nova data de consulta</h1>
            <p>Boa noite, ${consulta.paciente}!</p>
            <p>A psicologa Carol marcou uma nova data para você. A nova consulta será no dia ${consulta.data} às ${consulta.horario}</p>
            <p>Att.</p>
        `,
    })
    console.log(`Notificação enviada: ${info.messageId}`);
}

const notificarPacienteAlteracaoConsulta = async (consulta) => {
    const info = await transporter.sendMail({
        from: '"Clinica Psicologa" <gabrielmaia6743@gmail.com>',
        to: 'gabrielmaia6743@gmail.com', 
        subject: `Consulta alterada ${consulta.data}`,
        text: `Nova consulta marcada para você!`,
        html: `
            <h1>Nova data de consulta</h1>
            <p>Boa noite, ${consulta.paciente}!</p>
            <p>A psicologa Carol remarcou uma consulta sua. A nova consulta será no dia ${consulta.data} às ${consulta.horario}</p>
            <p>Att.</p>
        `,
    })
    console.log(`Notificação enviada: ${info.messageId}`);
}

router.post('/cadastrarConsulta', async (req, res) => {
    // realiazar cadastro de uma consulta
    const {paciente, data, horario, gravidade} = req.body;

    for (let consultas of consultasDB){
        if(consultas.data === data){
            if(consultas.horario !== horario){
                const id = Date.now();
                const consulta = new Consulta(id, paciente, data, horario, gravidade);

                consultasDB.push(consulta);
                fs.writeFileSync(bdPath,JSON.stringify(consultasDB,null,2));

                return res.status(200).send('Consulta cadastrada com sucesso');
            }else if(consultas.horario === horario && consultas.gravidade === gravidade){
                try{
                    const id = Date.now();
                    const consulta = new Consulta(id, paciente, data, horario, gravidade);

                    consultasDB.push(consulta);
                    fs.writeFileSync(bdPath,JSON.stringify(consultasDB,null,2));

                    await notificarPaciente(consulta);

                    return res.status(200).send('Consulta cadastrada com sucesso e paciente notificado');
                } catch (error){
                    return console.error('Erro ao processar mensagem:', error);
                }
            }else 
                return res.status(422).send("Horario já com consulta");
        } 
    }
    return res.status(422).send("Horario já com consulta")
});

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

router.delete('/deletarConsulta', (req, res) => {
    // excluir uma consulta (se quiser pode colocar pra n excluir muito em cima da hora)
    const {id, paciente, data, horario, gravidade} = req.body;

    let index = consultasDB.findIndex(usuario => usuario.id === id);

    consultasDB.splice(index, 1);

    fs.writeFileSync(bdPath,JSON.stringify(consultasDB, null, 2));
    return res.status(200).send('Consulta excluida');
});

module.exports = router;