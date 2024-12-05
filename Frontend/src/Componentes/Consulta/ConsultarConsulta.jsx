import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import mqtt from 'mqtt';
import '../CSS/Consultas.css';

export default function ConsultarConsulta() {
  const [consultas, setConsultas] = useState([]);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const client = mqtt.connect('wss://b7f0aae8c6514adeb1fb7f81c1743e30.s1.eu.hivemq.cloud:8884/mqtt', {
      username: 'Gamaia',
      password: 'Maia1234'
    });
  
    client.on('connect', () => {
      console.log('Conectado ao broker MQTT via WebSocket');
      client.subscribe('resposta/consultas', (err) => {
        if (err) {
          console.log('Erro ao subscrever no tópico:', err);
        } else {
          console.log('Inscrito no tópico resposta/consultas');
        }
      });
    });
  
    client.on('message', (topico, message) => {
      if (topico === 'resposta/consultas') {
        const dados = JSON.parse(message.toString());
        setConsultas(dados);
        console.log('Dados recebidos:', dados);
      }
    });
  
    // Publicar mensagem no tópico
    client.publish('consulta/consultas', JSON.stringify({ exemplo: 'dados' }), () => {
      console.log('Solicitação enviada ao tópico consulta/excluirConsulta');
    });
  
    // Recuperar dados do sessionStorage
    const storedEmail = sessionStorage.getItem('email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
    const storedUsername = sessionStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  
    // Encerrar a conexão ao desmontar o componente
    return () => {
      client.end();
    };
  }, []);
  

  const handleDelete = async (dados) => {
    const client = mqtt.connect('wss://b7f0aae8c6514adeb1fb7f81c1743e30.s1.eu.hivemq.cloud:8884/mqtt', {
      username: 'Gamaia',
      password: 'Maia1234'
    });
    const payload = JSON.stringify({
      id: dados.id,
      cip: dados.cip,
      username: username,
      email: email,
    });

    console.log('Enviando dados:', payload);
    client.publish('consulta/excluirConsulta', payload, () => {
      console.log('Mensagem publicada com sucesso no tópico "consulta/excluirConsulta"');
    });
  };

  return (
    <div className="pagina-consultas">
      {/* Menu */}
      <div className="menu">
        <nav>
          <Link to="/pagina-inicial" className="menu-item">Voltar à Página Inicial</Link>
          <Link to="/cadastraConsulta" className="menu-item">Cadastrar Consulta</Link>
        </nav>
      </div>
  
      {/* Conteúdo principal */}
      <div className="conteudo">
        {consultas.length > 0 ? (
          consultas.map((consulta) => (
            <div key={consulta.id} className="card">
              <h4>Consulta</h4>
              <p>Paciente: {consulta.paciente}</p>
              <p>Data: {consulta.data}</p>
              <p>Horário: {consulta.horario}</p>
              <p>Urgência: {consulta.gravidade}</p>
              <button className="delete-button" onClick={() => handleDelete(consulta)}>Excluir</button>
            </div>
          ))
        ) : (
          <p className="loading-message">Carregando consultas...</p>
        )}
      </div>
    </div>
  ); 
  
}
