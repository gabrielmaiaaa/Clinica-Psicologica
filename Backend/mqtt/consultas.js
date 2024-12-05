const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const client = mqtt.connect('mqtt://192.168.141.62:1883');

const bdPath = path.join(__dirname,'..','db','consulta.json');
const consultasDB = JSON.parse(fs.readFileSync(bdPath, {encoding: 'utf-8'}));

const usuarioBDPath = path.join(__dirname,'..','db','cliente.json');
const usuarioDB = JSON.parse(fs.readFileSync(usuarioBDPath, {encoding: 'utf-8'}));

const psicologoBDPath = path.join(__dirname,'..','db','administrativo.json');
const psicologoDB = JSON.parse(fs.readFileSync(psicologoBDPath, {encoding: 'utf-8'}));

require('dotenv').config();

const Consulta = require('../models/Consulta');

// Função para buscar um novo horário disponível para a consulta grave em dias seguintes
const buscarNovoHorario = (data, horarioAtual) => {
    const horariosDisponiveis = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

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
        // let dataFormatada = novaData.toISOString().split('T')[0];  // Data no formato YYYY-MM-DD
        let dataFormatada = novaData;  // Data no formato YYYY-MM-DD

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

client.on('connect', () => {
    console.log('Conectado ao broker MQTT');
    client.subscribe(['consulta/cadastrar', 'consulta/excluirConsulta', 'consulta/consultas'], (error) => {
        if (error) {
            console.error('Erro ao se inscrever no tópico:', error);
        } else {
            console.log('Inscrito no tópico "consulta/cadastrar", "consulta/excluirConsulta" e "consulta/consultas"');
        }
    });
})

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: process.env.email,
        pass: process.env.senha,
    },
})

const enviarNotificacao = async (destinatario, assunto, conteudoHTML) => {
    
    const info = await transporter.sendMail({
        from: '"Clinica Psicologa" <gabrielmaia6743@gmail.com>',
        to: destinatario,
        subject: assunto,
        html: conteudoHTML,
    });
    console.log(`Notificação enviada: ${info.messageId}`);
    
};

client.on('message', async (topico, message) => {
    console.log('Mensagem recebida no tópico:', topico);
    console.log('Mensagem recebida:', message.toString());  // Para ver o conteúdo da mensagem
    
    if (topico === 'consulta/cadastrar') {
        const dados = JSON.parse(message.toString());

        const pacienteExistente = usuarioDB.find(usuaio => usuaio.cpf === dados.cpf);
        
        if(!pacienteExistente){
            console.error('Usuario não existe no sistema');
            return;
        }

        // Verifica se já existe alguma consulta no mesmo dia e horário *antes* de cadastrar a nova consulta
        const conflitoConsulta = consultasDB.find(consulta => consulta.data === dados.data && consulta.horario === dados.horario);

        // Lógica de conflito com consulta grave
        if (conflitoConsulta) {
            if (conflitoConsulta.gravidade === 'grave') {
                // Se já existir uma consulta grave, não permite cadastrar
                console.log("Horário ocupado por uma consulta grave.");
                return;
            }

            if ((conflitoConsulta.gravidade === 'normal' || conflitoConsulta.gravidade === 'medio') && dados.gravidade === 'grave') {
                // Tentando encontrar um novo horário
                let novoHorario = buscarNovoHorario(dados.data, dados.horario);
                console.log('Novo horário encontrado:', novoHorario);
                
                if (!novoHorario) {
                    console.log("Não foi possível encontrar um novo horário disponível nos próximos 7 dias.");
                    return;
                }

                // Atualiza a consulta existente para o novo horário
                let index2 = consultasDB.findIndex(consulta => consulta.id === conflitoConsulta.id);
                if (index2 !== -1) {
                    consultasDB[index2].data = novoHorario.novaData;
                    consultasDB[index2].horario = novoHorario.novoHorario;

                    const pacienteReservado = usuarioDB.find(usuaio => usuaio.cpf === consultasDB[index2].cpf);

                    // Cria uma nova consulta grave
                    const id = Date.now();
                    const consultaGrave = new Consulta(id, dados.paciente, dados.cpf, dados.cip, dados.data, dados.horario, dados.gravidade);

                    // Adiciona a consulta grave no banco de dados
                    consultasDB.push(consultaGrave);
                    fs.writeFileSync(bdPath, JSON.stringify(consultasDB, null, 2));

                    const pacienteOficial = usuarioDB.find(usuaio => usuaio.cpf === consultaGrave.cpf);
        
                    if(!pacienteOficial){
                        console.error('Usuario não existe no sistema');
                        return;
                    }

                    const psicologoEncontrado = psicologoDB.find(usuaio => usuaio.cip === consultaGrave.cip);

                    const assunto = `Nova data da consulta ${consultasDB[index2].data}`
                    const assunto1 = `Nova data da consulta ${consultaGrave.data}`
                    const assunto2 = `Alterações de consultas de dois pacientes!`

                    const htmlPacienteReservado = `
                        <h1>Olá, ${pacienteReservado.username}!</h1>
                        <p>A consulta do dia ${consultaGrave.data} acabou sendo alterada!</p>
                        <p>A sua nova consulta ficou para ${consultasDB[index2].data} às ${consultasDB[index2].horario}</p>
                        <p>Att,</p>
                        <p>Clinica Psiquiatra</p>
                    `;
                    const htmlPacienteExistente = `
                        <h1>Olá, ${consultaGrave.paciente}!</h1>
                        <p>Nova consulta para o dia ${consultaGrave.data}!</p>
                        <p>Uma nova consulta foi marcada para o dia ${consultaGrave.data} às ${consultaGrave.horario}</p>
                        <p>Att,</p>
                        <p>Clinica Psiquiatra</p>
                    `;
                    const htmlPsicologo = `
                        <h1>Olá, ${psicologoEncontrado.username}!</h1>
                        <p>Algumas consultas suas foram alterados!</p>
                        <p>Uma nova consulta do paciente ${consultaGrave.paciente} foi marcada para o dia ${consultaGrave.data} às ${consultaGrave.horario}</p>
                        <p>E a do paciente ${pacienteReservado.username} para o dia ${consultasDB[index2].data} às ${consultasDB[index2].horario}</p>
                        <p>Att,</p>
                        <p>Clinica Psiquiatra</p>
                    `;
                    // Envia notificações
                    await Promise.all([
                        enviarNotificacao(pacienteReservado.email, assunto, htmlPacienteReservado), // Para a consulta substituída
                        enviarNotificacao(pacienteOficial.email, assunto1, htmlPacienteExistente), // Para a nova consulta grave
                        enviarNotificacao(psicologoEncontrado.email, assunto2, htmlPsicologo) // Para o psicologo grave
                    ])
                    console.log('Consulta grave reagendada com sucesso e paciente notificado.');
                    return;
                }
            } else {
                console.log("Horário ocupado por outra consulta.");
                return;
            }
        }

        // Se não houver conflito, cria a nova consulta
        try {
            const id = Date.now();
            const consulta = new Consulta(id, dados.paciente, dados.cpf, dados.cip, dados.data, dados.horario, dados.gravidade);

            consultasDB.push(consulta);
            fs.writeFileSync(bdPath, JSON.stringify(consultasDB, null, 2));

            const psicologoEncontrado = psicologoDB.find(usuaio => usuaio.cip === consulta.cip);

            if(!psicologoEncontrado){
                console.error('Psicologo não encontrado');
                return;
            }

            // Se for consulta grave, notifica o paciente
            if (dados.gravidade === 'grave') {
                const assunto = `Nova data da consulta ${consulta.data}`

                const htmlPacienteReservado = `
                    <h1>Olá, ${pacienteExistente.username}!</h1>
                    <p>Nova consulta para o dia ${consulta.data}!</p>
                    <p>Uma nova consulta ficou para o dia ${consulta.data} às ${consulta.horario}</p>
                    <p>Att,</p>
                    <p>Clinica Psiquiatra</p>
                `;
                const htmlPsicologo = `
                    <h1>Olá, ${psicologoEncontrado.username}!</h1>
                    <p>Nova consulta para o dia ${consulta.data}!</p>
                    <p>Uma nova consulta ficou para o dia ${consulta.data} às ${consulta.horario}</p>
                    <p>Att,</p>
                    <p>Clinica Psiquiatra</p>
                `;
                await Promise.all([
                    enviarNotificacao(pacienteExistente.email, assunto, htmlPacienteReservado),
                    enviarNotificacao(psicologoEncontrado.email, assunto, htmlPsicologo)
                ]);
                console.log('Consulta grave cadastrada com sucesso e paciente notificado.');
                return
            }

        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
        }
    } else if (topico === 'consulta/excluirConsulta') {
        try{
            const dados = JSON.parse(message.toString());
            console.log(dados);
        
            // Função para encontrar o índice pelo ID
            const acharIndex = (p) => {
                return p.id === Number(dados.id);
            };
        
            const index = consultasDB.findIndex(acharIndex);
            
            if (index === -1) {
                console.log('Consulta não encontrada');
                return;
            }
        
            // Verificar se a data está próxima
            const consulta = consultasDB[index];

            const psicologoEncontrado = psicologoDB.find(usuaio => usuaio.cip === consulta.cip);

            if(!psicologoEncontrado){
                console.error('Psicologo não encontrado');
                return;
            }

            const agora = new Date();
            agora.setHours(0, 0, 0, 0);
            const dataConsulta = new Date(consulta.data);
            const diferencaHoras = (dataConsulta - agora) / (1000 * 60 * 60);
                
            if (diferencaHoras <= 24 && diferencaHoras > 0) {
                console.log('A consulta está muito próxima e não pode ser excluída.');
                return;
            }

            const pacienteExistente = usuarioDB.find(usuaio => usuaio.cpf === consulta.cpf);
        
            if(!pacienteExistente){
                console.error('Usuario não existe no sistema');
                return;
            }
            
            const assunto = `Cancelamento da consulta do dia ${consulta.data}`
            const htmlPaciente = `
                <h1>Olá, ${pacienteExistente.paciente}!</h1>
                <p>A consulta do dia ${consulta.data} acabou sendo cancelada, caso queira verificar a situação, basta acessar nosso site!</p>
                <p>Att,</p>
                <p>Clinica Psiquiatra</p>
            `;
            const htmlPsicologa = `
                <h1>Olá, ${psicologoEncontrado.username}!</h1>
                <p>A consulta do dia ${consulta.data} acabou sendo cancelada. Qualquer coisa só verificar no sistema!</p>
                <p>Att,</p>
                <p>Clinica Psiquiatra</p>
            `;
            
            await Promise.all([
                enviarNotificacao(pacienteExistente.email, assunto, htmlPaciente), // alertar o cliente que cancelou a consulta
                enviarNotificacao(psicologoEncontrado.email, assunto, htmlPsicologa) // alertar a psicologa q cancelou a consulta
              ]);
              
        
            // Excluir a consulta
            consultasDB.splice(index, 1);
        
            fs.writeFileSync(bdPath, JSON.stringify(consultasDB, null, 2));
            console.log('Consulta excluída');
            return;
        } catch (error) {
            console.error("Erro ao processar mensagem:", error.message);
        }
    } else if (topico === 'consulta/consultas'){
        const dadosConsulta = JSON.stringify(consultasDB);
        console.log(dadosConsulta);        
        
        client.publish('resposta/consultas', dadosConsulta);
    }
});
