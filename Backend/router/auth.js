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
const bdPath = path.join(__dirname,'..','db','cliente.json');
const usuariosCadastrados = JSON.parse(fs.readFileSync(bdPath, {encoding: 'utf-8'}));

const administrativoBDPath = path.join(__dirname,'..','db','administrativo.json');
const psicologosCadastrados = JSON.parse(fs.readFileSync(administrativoBDPath, {encoding: 'utf-8'}));

//Importars modelo de usuário
const User = require('../models/User');

//dotenv
require('dotenv').config();

router.get('/usuarios', autenticadorToken, (req,res) =>{

    //Devolve as propriedades em formato JSON
    res.status(200).json(usuariosCadastrados);

});


router.get('/usuarioLogado/:email', (req,res) => {
    const { email } = req.params;

    const dadosExpecificos = [];

    
    const dados = usuariosCadastrados.find(usuario => usuario.email === email);

    if (dados) {
        dadosExpecificos.push({
            username: dados.username,
            email: dados.email
        });
    }
    res.status(200).json(jogoDaJam);
});

//requisição POST para autenticar usuário.
//rota pública
router.post('/login', async (req,res) => {

    //extraindo os dados do formulário para criacao do usuario
    const {email, password} = req.body; 

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
                return res.status(200).json({
                    token: tokenAcesso,
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    admin: 0
                });
            }
            else
                return res.status(422).send(`Usuario ou senhas incorretas.`);
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
                return res.status(210).json({
                    token: tokenAcesso,
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    admin: 1
                });
            }
            else
                return res.status(422).send(`Usuario ou senhas incorretas.`);
        }   
    }
    //Nesse ponto não existe usuario com email informado.
    return res.status(409).send(`Usuario com email ${email} não existe. Considere criar uma conta!`);

})

//requisição POST para cadastrar usuário.
//rota pública
router.post('/create', async (req, res) => {
    // Extraindo os dados do formulário
    const { username, email, password, cpf, endereco, telefone, idade } = req.body;

    // Verificar se todos os campos obrigatórios foram enviados
    if (!username || !email || !password || !cpf || !endereco || !telefone || !idade) {
        return res.status(400).send('Todos os campos são obrigatórios!');
    }

    // Verificar se já existe um usuário com esse e-mail
    for (let user of usuariosCadastrados) {
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
    const user = new User(id, username, email, passwordCrypt, cpf, endereco, telefone, idade);

    // Salva o usuário no "banco"
    usuariosCadastrados.push(user);

    // Atualiza o arquivo JSON com os usuários cadastrados
    fs.writeFileSync(bdPath, JSON.stringify(usuariosCadastrados, null, 2));

    // Retorna uma resposta de sucesso
    res.status(200).send(`Usuário criado com sucesso. ID: ${id}`);
});

router.put('/atualizar', async (req,res) => {
    const {id, username, email, password} = req.body;
    let cont = 0;

    for (let users of usuariosCadastrados){
        if(users.email === email){
            cont = cont + 1;
            if(cont === 2)
                return res.status(409).send(`Usuario com email ${email} já existe.`);
        }   
    }

    const salt = await bcrypt.genSalt(10);
    const passwordCrypt = await bcrypt.hash(password,salt);

    const novoDados = {
        id,
        username,
        email,
        password: passwordCrypt
    }

    const acharUser = (p) => {
        return p.id === Number(id);
    }

    const index = usuariosCadastrados.findIndex(acharUser);

    usuariosCadastrados.splice(index, 1, novoDados);
    fs.writeFileSync(bdPath, JSON.stringify(usuariosCadastrados,null,2));
    res.status(200).send('Usuário Atualizado');
});

router.delete('/deletar/:id', (req,res) => {
    const {id} = req.params;

    const acharIndex = (p) => {
        return p.id === Number(id);
    }

    const index = usuariosCadastrados.findIndex(acharIndex);
    console.log(index);
    console.log(usuariosCadastrados[index]);

    usuariosCadastrados.splice(index, 1);
    console.log(usuariosCadastrados);
    fs.writeFileSync(bdPath,JSON.stringify(usuariosCadastrados, null, 2));
    return res.status(200).send('Usuário Removido');
});

function autenticadorToken(req, res, next){
    const authH = req.headers['authorization'];
    const token = authH && authH.split(' ')[1];
    if(token === null) return res.status(401).send('Token não encontrado');
    
    try{
        const user = jwt.verify(token, process.env.TOKEN);
        req.user = user;
        next();  //Se token é válido, avança chamando next()
    } catch (error) {
        res.status(403).send('Token inválido')
    }
}

module.exports = router;