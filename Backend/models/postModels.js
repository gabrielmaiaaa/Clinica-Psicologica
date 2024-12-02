const express = require('express');
const { buscarNovoHorario, salvarConsulta, deletarConsulta } = require('../services/consultaService');
const { enviarNotificacao } = require('../services/notificationService');
const conectarAoBanco = require('../config/banco');
const { ObjectId } = require('mongodb');

const router = express.Router();

// Conexão com o banco de dados
const conexao = await conectarAoBanco(conectarAoBanco);
const db = conexao.db("mqtt");
const collection = db.collection("Consulta");

router.get('/consultas', async (req, res) => {
    try {
        const consultas = await collection.find().toArray();
        res.status(200).json(consultas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/cadastrarConsulta', async (req, res) => {
    const { paciente, data, horario, gravidade, email } = req.body;

    try {
        const conflito = await collection.findOne({ data, horario });

        if (conflito) {
            if (conflito.gravidade === 'grave') {
                return res.status(422).send("Horário ocupado por uma consulta grave.");
            }
            if (gravidade === 'grave') {
                const novoHorario = buscarNovoHorario(data, horario);
                if (!novoHorario) {
                    return res.status(422).send("Sem horários disponíveis.");
                }

                await collection.updateOne(
                    { _id: ObjectId(conflito._id) },
                    { $set: { data: novoHorario.novaData, horario: novoHorario.novoHorario } }
                );

                const novaConsulta = { paciente, data, horario, gravidade, email };
                await collection.insertOne(novaConsulta);

                enviarNotificacao(conflito.email, 'Consulta remarcada', 'Sua consulta foi reagendada.');
                return res.status(200).send("Consulta grave adicionada e conflito resolvido.");
            }
            return res.status(422).send("Horário ocupado.");
        }

        const novaConsulta = { paciente, data, horario, gravidade, email };
        await collection.insertOne(novaConsulta);

        if (gravidade === 'grave') {
            await enviarNotificacao(paciente, 'Nova consulta', 'Detalhes...');
        }
        res.status(200).send("Consulta cadastrada.");
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/deletarConsulta', async (req, res) => {
    const { id } = req.body;

    try {
        await collection.deleteOne({ _id: ObjectId(id) });
        res.status(200).send("Consulta deletada.");
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
