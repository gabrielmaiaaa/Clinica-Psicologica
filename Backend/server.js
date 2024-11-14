//importar libs externas
const express = require('express'); //npm i express
const cors = require('cors'); //npm i cors

//Instância do servidor
const app = express();

//Liberar rota cors
app.use(cors());
//Função para extrair os dados do pacote IP
app.use(express.json())

//importar rota das votações

//rotas para os dois serviços

app.listen(3000, ()=>{
    console.log('Servidor Online');
});