import express from "express"
import multer from "multer";
import cors from "cors";
import { listarClientes, listarConsultas, listarRelato, postarNovoCliente, postarNovoConsulta, postarNovoRelato, atualizarNovoConsulta } from "../controllers/postControllers.js";

const corsOptions = {
    origin: "http://localhost:8000",
    optionsSuccessStatus: 200
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})

const upload = multer({ dest: "./uploads" , storage})

const routes = (app) =>{
    // Middleware para parsear JSON no corpo das requisições
    app.use(express.json());
    app.use(cors(corsOptions))
    // Rota para obter todos os posts
    app.get("/clientes", listarClientes);
    app.get("/consulta", listarConsultas);
    app.get("/relato", listarRelato);
    // Rota para criar um post
    app.post("/cadastrarCliente",postarNovoCliente);
    app.post("/cadastrarConsulta",postarNovoConsulta);
    app.post("/cadastrarRelato",postarNovoRelato);
    // Rota para colocar a imagem
    app.put("/uploadConsulta/:id", atualizarNovoConsulta);
}


export default routes;


