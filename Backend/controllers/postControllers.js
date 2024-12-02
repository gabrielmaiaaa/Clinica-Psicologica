import { getTodosClientes, getTodosConsultas, getTodosRelato, criarCliente, criarConsulta, criarRelato, atualizarConsulta } from "../models/postModels.js";
import fs from "fs";

export async function listarClientes(req, res) {
    // Chama a função para obter todos os posts
    const clientes = await getTodosClientes();
    // Envia uma resposta com status 200 (OK) e os posts em formato JSON
    res.status(200).json(clientes);
}

export async function listarConsultas(req, res) {
    // Chama a função para obter todos os posts
    const consultas = await getTodosConsultas();
    // Envia uma resposta com status 200 (OK) e os posts em formato JSON
    res.status(200).json(consultas);
}

export async function listarRelato(req, res) {
    // Chama a função para obter todos os posts
    const relato = await getTodosRelato();
    // Envia uma resposta com status 200 (OK) e os posts em formato JSON
    res.status(200).json(relato);
}

export async function postarNovoCliente(req,res) {
    const novoCliente = req.body;
    try{
        const ClienteCriado = await criarCliente(novoCliente);
        res.status(200).json(ClienteCriado);
    }catch(erro){
        console.error(erro.message);
        res.status(500).json({"Erro": "Falha na requisição"});
    }
}

export async function postarNovoConsulta(req,res) {
    const novoConsulta = req.body;
    try{
        const ConsultaCriado = await criarConsulta(novoConsulta);
        res.status(200).json(ConsultaCriado);
    }catch(erro){
        console.error(erro.message);
        res.status(500).json({"Erro": "Falha na requisição"});
    }
}

export async function postarNovoRelato(req,res) {
    const novoRelato = req.body;
    try{
        const RelatoCriado = await criarRelato(novoRelato);
        res.status(200).json(RelatoCriado);
    }catch(erro){
        console.error(erro.message);
        res.status(500).json({"Erro": "Falha na requisição"});
    }
}


export async function uploadImagem(req,res) {
    const novoPost = {
        descricao: "",
        imagem: req.file.originalname,
        alt: ""
    };
    try{
        const postCriado = await criarPost(novoPost);
        const imagemAtualizada = `uploads/${postCriado.insertedId}.png` 
        fs.renameSync(req.file.path, imagemAtualizada);
        res.status(200).json(postCriado);
    }catch(erro){
        console.error(erro.message);
        res.status(500).json({"Erro": "Falha na requisição"});
    }
}

export async function atualizarNovoConsulta(req,res) {
    const idConsulta = req.params.id;
    const urlImagem = `http://localhost:3000/${idConsulta}.png`
    
    try{
        const imagemBuffer = fs.readFileSync(`uploads/${idConsulta}.png`);
        const Consulta = {
            imagem: urlImagem,
            descricao: descricao,
            alt: req.body.alt
        }
        const ConsultaCriado = await atualizarConsulta(idConsulta, Consulta);
        res.status(200).json(ConsultaCriado);
    }catch(erro){
        console.error(erro.message);
        res.status(500).json({"Erro": "Falha na requisição"});
    }
}