const fs = require('fs');
const path = require('path');
const consultasDB = require('../db/consultasDB');
const Consulta = require('../models/Consulta');

// Função para salvar alterações no JSON
const salvarConsultas = () => {
    const bdPath = path.join(__dirname, '../db/consulta.json');
    fs.writeFileSync(bdPath, JSON.stringify(consultasDB, null, 2));
};

// Função para buscar novo horário
const buscarNovoHorario = (data, horarioAtual) => {
    const horariosDisponiveis = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
    let dataAtual = new Date(data);
    const limiteDias = 7;

    for (let diaOffset = 0; diaOffset < limiteDias; diaOffset++) {
        let novaData = new Date(dataAtual);
        novaData.setDate(dataAtual.getDate() + diaOffset);
        let dataFormatada = novaData.toISOString().split('T')[0];

        for (let horario of horariosDisponiveis) {
            if (!consultasDB.some(consulta => consulta.data === dataFormatada && consulta.horario === horario)) {
                return { novaData: dataFormatada, novoHorario: horario };
            }
        }
    }
    return null;
};

// Função para salvar uma consulta
const salvarConsulta = (novaConsulta) => {
    consultasDB.push(novaConsulta);
    salvarConsultas();
};

// Função para deletar uma consulta
const deletarConsulta = (id) => {
    const index = consultasDB.findIndex(consulta => consulta.id === id);
    if (index === -1) throw new Error('Consulta não encontrada.');
    consultasDB.splice(index, 1);
    salvarConsultas();
};

module.exports = { buscarNovoHorario, salvarConsulta, deletarConsulta };
