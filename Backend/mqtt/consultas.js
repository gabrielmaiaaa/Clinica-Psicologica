const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');

const client = mqtt.connect('wss://test.mosquitto.org:8081');

const bdPath = path.join(__dirname,'..','db','consulta.json');
const consultasDB = JSON.parse(fs.readFileSync(bdPath, {encoding: 'utf-8'}));

const Consulta = require('../models/Consulta');

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

client.on('connect', () => {
    console.log('Conectado ao broker MQTT');
    client.subscribe(['consulta/cadastrar', 'consulta/excluirConsulta'], (error) => {
        if (error) {
            console.error('Erro ao se inscrever no tópico:', error);
        } else {
            console.log('Inscrito no tópico "consulta/cadastrar" e no "consulta/excluirConsulta"');
        }
    });
})

client.on('message', async (topico, message) => {
    console.log('Mensagem recebida no tópico:', topico);
    console.log('Mensagem recebida:', message.toString());  // Para ver o conteúdo da mensagem
    
    if (topico === 'consulta/cadastrar') {
        const dados = JSON.parse(message.toString());

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

                    // Cria uma nova consulta grave
                    const id = Date.now();
                    const consultaGrave = new Consulta(id, dados.paciente, dados.data, dados.horario, dados.gravidade);

                    // Adiciona a consulta grave no banco de dados
                    consultasDB.push(consultaGrave);
                    fs.writeFileSync(bdPath, JSON.stringify(consultasDB, null, 2));

                    // Envia notificações
                    await notificarPacienteAlteracaoConsulta(consultasDB[index2]); // Para a consulta substituída
                    await notificarPaciente(consultaGrave); // Para a nova consulta grave

                    console.log('Consulta grave reagendada com sucesso e paciente notificado.');
                }
            } else {
                console.log("Horário ocupado por outra consulta.");
                return;
            }
        }

        // Se não houver conflito, cria a nova consulta
        try {
            const id = Date.now();
            const consulta = new Consulta(id, dados.paciente, dados.data, dados.horario, dados.gravidade);

            consultasDB.push(consulta);
            fs.writeFileSync(bdPath, JSON.stringify(consultasDB, null, 2));

            // Se for consulta grave, notifica o paciente
            if (dados.gravidade === 'grave') {
                await notificarPaciente(consulta);
                console.log('Consulta grave cadastrada com sucesso e paciente notificado.');
            }

        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
        }
    } else if (topico === 'consulta/excluirConsulta'){
        const dados = JSON.parse(message.toString());
        console.log(dados);
        
        const acharIndex = (p) => {
            return p.id === Number(dados.id);
        }
    
        const index = consultasDB.findIndex(acharIndex);
        
        console.log(index);
    
        consultasDB.splice(index, 1);
    
        fs.writeFileSync(bdPath,JSON.stringify(consultasDB, null, 2));
        console.log('Consulta excluida');
        return;
    }
});
