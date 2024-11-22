const express = require('express'); 
const fs = require('fs');
const path = require('path');

const router = express.Router();

//Conexao com banco de dados
const bdPath = path.join(__dirname,'..','db','consulta.json');
const consultasDB = JSON.parse(fs.readFileSync(bdPath, {encoding: 'utf-8'}));

router.post('/cadastrarConsulta', async (req, res) => {
    // realiazar cadastro de uma consulta
});

router.put('/atualizarConsulta', async (req, res) => {
    // permitir atualizar data de uma consulta (verificando se já existe uma e permitindo somente o psicologo alterar data que tem conflito)
})

router.delete('/deletarConsulta', (req, res) => {
    // excluir uma consulta (se quiser pode colocar pra n excluir muito em cima da hora)
})

module.exports = router;