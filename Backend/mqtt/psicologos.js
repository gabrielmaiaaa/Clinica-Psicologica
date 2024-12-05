// mqtt
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://192.168.141.62:1883');

//autenticacao e cryp
const bcrypt = require('bcrypt');//npm i bcrypt
const jwt = require('jsonwebtoken');

//libs para banco de dados
const fs = require('fs');
const path = require('path');

//Conexao com banco de dados
const administrativoBDPath = path.join(__dirname,'..','db','administrativo.json');
const psicologosCadastrados = JSON.parse(fs.readFileSync(administrativoBDPath, {encoding: 'utf-8'}));

//Importars modelo de usuário
const Psicologo = require('../models/Psicologo');

//dotenv
require('dotenv').config();

client.on('connect', () => {
    console.log('Conectado ao broker MQTT');
    client.subscribe('psicologo/create', (error) => {
        if (error) {
            console.error('Erro ao se inscrever no tópico:', error);
        } else {
            console.log('Inscrito no tópico "psicologo/create"');
        }
    });
})

client.on('message', async (topico, message) => {
    console.log('Mensagem recebida no tópico:', topico);
    console.log('Mensagem recebida:', message.toString());  // Para ver o conteúdo da mensagem
    
    if (topico === 'psicologo/create') {
        const { username, email, password, cpf, endereco, telefone, cip } = JSON.parse(message.toString());

        // Verificar se todos os campos obrigatórios foram enviados
        if (!username || !email || !password || !cpf || !endereco || !telefone || !cip) {
            console.log('Todos os campos são obrigatórios!');
            return;
        }

        // Verificar se já existe um usuário com esse e-mail
        for (let user of psicologosCadastrados) {
            if (user.email === email) {
                // Usuário já existe, impossível criar outro
                console.log('Usuário já existe.');
                return;
            }
            if (user.cpf === cpf) {
                // CPF já cadastrado, impossível criar outro
                console.log('CPF já cadastrado.');
                return;
            }
            if (user.cip === cip) {
                // CPF já cadastrado, impossível criar outro
                console.log('CIP já cadastrado.');
                return;
            }
        }

        // Gerar um ID único para o novo usuário (você pode optar por outra forma, como incrementação de ID)
        const id = Date.now();

        // Gerar uma senha criptografada
        const salt = await bcrypt.genSalt(10);
        const passwordCrypt = await bcrypt.hash(password, salt);

        // Criando o objeto do usuário com todos os campos
        const psicologo = new Psicologo(id, username, email, passwordCrypt, cpf, endereco, telefone, cip);

        // Salva o usuário no "banco"
        psicologosCadastrados.push(psicologo);

        // Atualiza o arquivo JSON com os usuários cadastrados
        fs.writeFileSync(administrativoBDPath, JSON.stringify(psicologosCadastrados, null, 2));

        const confirmacao = JSON.stringify({
            status: 200
        })

        // Retorna uma resposta de sucesso
        client.publish('psicologo/AutorizacaoCreate', confirmacao);
        console.log('Usuário criado com sucesso. ID');
    }
})