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

router.get('/consultas', (req, res) => {
    res.status(200).json(consultasDB);
})

// Função para buscar um novo horário disponível para a consulta grave em dias seguintes
const buscarNovoHorario = (data, horarioAtual) => {
    const horariosDisponiveis = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

    // Convertendo a data de string para objeto Date
    let dataAtual = new Date(data);
    
    // Definir o número de dias que podemos buscar para frente (exemplo: 7 dias)
    const limiteDias = 7;
    
    // Tentando encontrar horários disponíveis nos próximos dias
    for (let diaOffset = 0; diaOffset < limiteDias; diaOffset++) {
        // Incrementando a data de acordo com o offset (dias seguintes)
        let novaData = new Date(dataAtual);
        novaData.setDate(dataAtual.getDate() + diaOffset);
        
        // Formatando a data novamente para comparar
        let dataFormatada = novaData.toISOString().split('T')[0];  // Data no formato YYYY-MM-DD

        // Verificando se já existe alguma consulta no novo dia
        for (let i = 0; i < horariosDisponiveis.length; i++) {
            if (!consultasDB.some(consulta => consulta.data === dataFormatada && consulta.horario === horariosDisponiveis[i])) {
                return { novaData: dataFormatada, novoHorario: horariosDisponiveis[i] };  // Retorna o primeiro horário livre
            }
        }
    }

    // Se não encontrar horário disponível em nenhum dos próximos 7 dias
    return null;
};

router.post('/cadastrarConsulta', async (req, res) => {
    const { paciente, data, horario, gravidade } = req.body;

    // Verifica se já existe alguma consulta no mesmo dia e horário *antes* de cadastrar a nova consulta
    const conflitoConsulta = consultasDB.find(consulta => consulta.data === data && consulta.horario === horario);

    // Se houver um conflito com uma consulta grave, não permite o cadastro
    if (conflitoConsulta) {
        if (conflitoConsulta.gravidade === 'grave') {
            return res.status(422).send("Horário já ocupado por uma consulta grave.");
        }

        // Se o horário está ocupado por uma consulta não grave e a nova for grave, substitui a consulta existente
        if ((conflitoConsulta.gravidade === 'normal' || conflitoConsulta.gravidade === 'medio') && gravidade === 'grave') {
            try {
                // Tentando encontrar um novo horário disponível
                let novoHorario = buscarNovoHorario(data, horario);
                console.log('Novo horário encontrado:', novoHorario);
                
                if (!novoHorario) {
                    return res.status(422).send("Não foi possível encontrar um novo horário disponível nos próximos 7 dias.");
                }
        
                // Agora, vamos procurar a consulta que será substituída (a consulta com a gravidade 'normal' ou 'medio')
                let index2 = consultasDB.findIndex(consulta => consulta.id === conflitoConsulta.id);
                
                if (index2 !== -1) {
                    // Atualiza a consulta existente para o novo horário
                    consultasDB[index2].data = novoHorario.novaData; // A nova data retornada pela função buscarNovoHorario
                    consultasDB[index2].horario = novoHorario.novoHorario; // O novo horário
        
                    // Cria a nova consulta grave com a data e horário que estava disponível
                    const id = Date.now();
                    const consultaGrave = new Consulta(id, paciente, data, horario, gravidade);
        
                    // Adiciona a nova consulta grave no banco de dados
                    consultasDB.push(consultaGrave);
        
                    // Salva no arquivo JSON
                    fs.writeFileSync(bdPath, JSON.stringify(consultasDB, null, 2));
        
                    // Envia as notificações
                    await notificarPacienteAlteracaoConsulta(consultasDB[index2]); // Envia notificação para a consulta substituída
                    await notificarPaciente(consultaGrave); // Envia notificação para a nova consulta grave
        
                    return res.status(200).send('Consulta grave reagendada com sucesso e paciente notificado.');
                } else {
                    return res.status(404).send("Consulta de conflito não encontrada.");
                }
        
            } catch (error) {
                console.error('Erro ao processar mensagem:', error);
                return res.status(500).send('Erro ao notificar o paciente.');
            }        
        } else {
            // Caso o horário esteja ocupado por outra consulta grave ou não grave, retorna erro
            return res.status(422).send("Horário já ocupado por outra consulta.");
        }
    }

    // Se não houver conflito, cria a nova consulta
    try {
        const id = Date.now();
        const consulta = new Consulta(id, paciente, data, horario, gravidade);

        // Agora, só salva a consulta no banco de dados se não houver conflito
        consultasDB.push(consulta);
        fs.writeFileSync(bdPath, JSON.stringify(consultasDB, null, 2));

        // Se for consulta grave, notifica o paciente
        if (gravidade === 'grave') {
            await notificarPaciente(consulta);
            return res.status(200).send('Consulta grave cadastrada com sucesso e paciente notificado.');
        }

        return res.status(200).send("Consulta cadastrada com sucesso.");
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        return res.status(500).send('Erro ao cadastrar consulta.');
    }
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

router.delete('/deletarConsulta/:id', (req, res) => {
    // excluir uma consulta (se quiser pode colocar pra n excluir muito em cima da hora)
    const {id} = req.params;
    console.log(id);
    
    const acharIndex = (p) => {
        return p.id === Number(id);
    }

    const index = consultasDB.findIndex(acharIndex);
    
    console.log(index);

    consultasDB.splice(index, 1);

    fs.writeFileSync(bdPath,JSON.stringify(consultasDB, null, 2));
    return res.status(200).send('Consulta excluida');
});

module.exports = router;