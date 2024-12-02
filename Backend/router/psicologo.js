//importar libs externas
const express = require('express'); //npm i express

//O router permite separar nosso servidor em rotas
const router = express.Router();

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

router.get('/getPsicologo/:email', (req,res) => {
    const { email } = req.params;

    const dadosExpecificos = [];

    
    const dados = psicologosCadastrados.find(usuario => usuario.email === email);

    if (dados) {
        dadosExpecificos.push({
            username: dados.username,
            email: dados.email
        });
    }
    res.status(200).json(jogoDaJam);
});

router.post('/createPsicologo', async (req, res) => {
    // Extraindo os dados do formulário
    const { username, email, password, cpf, endereco, telefone, cip } = req.body;

    // Verificar se todos os campos obrigatórios foram enviados
    if (!username || !email || !password || !cpf || !endereco || !telefone || !cip) {
        return res.status(400).send('Todos os campos são obrigatórios!');
    }

    // Verificar se já existe um usuário com esse e-mail
    for (let user of psicologosCadastrados) {
        if (user.email === email) {
            // Usuário já existe, impossível criar outro
            return res.status(409).send('Usuário já existe.');
        }
        if (user.cpf === cpf) {
            // CPF já cadastrado, impossível criar outro
            return res.status(409).send('CPF já cadastrado.');
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

    // Retorna uma resposta de sucesso
    res.status(200).send(`Usuário criado com sucesso. ID: ${id}`);
});

module.exports = router;