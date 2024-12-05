// mqtt
const mqtt = require('mqtt');
const client = mqtt.connect('mqtts://b7f0aae8c6514adeb1fb7f81c1743e30.s1.eu.hivemq.cloud:8883', {
    username: 'Gamaia',
    password: 'Maia1234'
  });

//autenticacao e cryp
const bcrypt = require('bcrypt');//npm i bcrypt
const jwt = require('jsonwebtoken');

//libs para banco de dados
const fs = require('fs');
const path = require('path');

//Conexao com banco de dados
const bdPath = path.join(__dirname,'..','db','cliente.json');
const usuariosCadastrados = JSON.parse(fs.readFileSync(bdPath, {encoding: 'utf-8'}));

//Importars modelo de usuário
const User = require('../models/User');

//dotenv
require('dotenv').config();

client.on('connect', () => {
    console.log('Conectado ao broker MQTT');
    client.subscribe('auth/create', (error) => {
        if (error) {
            console.error('Erro ao se inscrever no tópico:', error);
        } else {
            console.log('Inscrito no tópico "auth/create"');
        }
    });
})

client.on('message', async (topico, message) => {
    console.log('Mensagem recebida no tópico:', topico);
    console.log('Mensagem recebida:', message.toString());  // Para ver o conteúdo da mensagem
    
    if (topico === 'auth/create') {
        const { username, email, password, cpf, endereco, telefone, idade } = JSON.parse(message.toString());

        // Verificar se todos os campos obrigatórios foram enviados
        if (!username || !email || !password || !cpf || !endereco || !telefone || !idade) {
            console.log('Todos os campos são obrigatórios!');
            return;
        }

        // Verificar se já existe um usuário com esse e-mail
        for (let user of usuariosCadastrados) {
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
        }

        // Gerar um ID único para o novo usuário (você pode optar por outra forma, como incrementação de ID)
        const id = Date.now();

        // Gerar uma senha criptografada
        const salt = await bcrypt.genSalt(10);
        const passwordCrypt = await bcrypt.hash(password, salt);

        // Criando o objeto do usuário com todos os campos
        const user = new User(id, username, email, passwordCrypt, cpf, endereco, telefone, idade);

        // Salva o usuário no "banco"
        usuariosCadastrados.push(user);

        // Atualiza o arquivo JSON com os usuários cadastrados
        fs.writeFileSync(bdPath, JSON.stringify(usuariosCadastrados, null, 2));

        const confirmacao = JSON.stringify({
            status: 200
        })

        // Retorna uma resposta de sucesso
        client.publish('auth/AutorizacaoCreate', confirmacao);
        console.log('Usuário criado com sucesso. ID: ${id}');
    }
})