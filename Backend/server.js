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
const authRoutes = require('./router/auth');
const consultaRoutes = require('./router/consulta');
const psicologoRoutes = require('./router/psicologo');

//rotas para os dois serviços
app.use('/auth', authRoutes);
app.use('/consulta', consultaRoutes);
app.use('/psicologo', psicologoRoutes);

app.listen(3000, ()=>{
    console.log('Servidor Online');
});