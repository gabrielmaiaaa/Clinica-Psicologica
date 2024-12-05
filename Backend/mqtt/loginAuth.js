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
const bdPath = path.join(__dirname,'..','db','cliente.json');
const usuariosCadastrados = JSON.parse(fs.readFileSync(bdPath, {encoding: 'utf-8'}));

const administrativoBDPath = path.join(__dirname,'..','db','administrativo.json');
const psicologosCadastrados = JSON.parse(fs.readFileSync(administrativoBDPath, {encoding: 'utf-8'}));

//Importars modelo de usuário
const User = require('../models/User');

//dotenv
require('dotenv').config();

client.on('connect', () => {
    console.log('Conectado ao broker MQTT');
    client.subscribe('auth/login', (error) => {
        if (error) {
            console.error('Erro ao se inscrever no tópico:', error);
        } else {
            console.log('Inscrito no tópico "auth/login"');
        }
    });
})

client.on('message', async (topico, message) => {
    console.log('Mensagem recebida no tópico:', topico);
    console.log('Mensagem recebida:', message.toString());  // Para ver o conteúdo da mensagem
    
    if (topico === 'auth/login') {
        //extraindo os dados do formulário para criacao do usuario
        const {email, password} = JSON.parse(message.toString()); 

        //verifica se existe usuario com email       
        for (let user of usuariosCadastrados){
            if(user.email === email){
                //usuario existe.  Agora é verificar a senha
                const passwordValidado = await bcrypt.compare(password, user.password);
                if(passwordValidado===true){
                    //Usuario foi autenticado.
                    //Agora vamos retornar um token de acesso
                    //para isso usamos jwt
                    //O primeiro parametro é o que queremos serializar (o proprio user)
                    //O segundo parametro é a chave secreta do token. Está no arquivo .env
                    //La coloquei as instruções de como gerar
                    const tokenAcesso = jwt.sign(user,process.env.TOKEN);
                    const dadosCliente = JSON.stringify({
                        token: tokenAcesso,
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        admin: 1
                    })
                    client.publish('auth/Autorizacao', dadosCliente);
                }
                else
                    return;
            }   
        }

        for (let user of psicologosCadastrados){
            if(user.email === email){
                //usuario existe.  Agora é verificar a senha
                const passwordValidado = await bcrypt.compare(password, user.password);
                if(passwordValidado===true){
                    //Usuario foi autenticado.
                    //Agora vamos retornar um token de acesso
                    //para isso usamos jwt
                    //O primeiro parametro é o que queremos serializar (o proprio user)
                    //O segundo parametro é a chave secreta do token. Está no arquivo .env
                    //La coloquei as instruções de como gerar
                    const tokenAcesso = jwt.sign(user,process.env.TOKEN);
                    const dadosCliente = JSON.stringify({
                        token: tokenAcesso,
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        admin: 1
                    })
                    client.publish('auth/Autorizacao', dadosCliente);
                }
                else
                    return;
            }   
        }
        //Nesse ponto não existe usuario com email informado.
        return;
    }
})