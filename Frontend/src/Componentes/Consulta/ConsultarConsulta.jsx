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
    const acharConsultas = async () => {
      try {
        const resposta = await axios.get(`http://localhost:3000/consulta/consultas`);
        if (resposta.status === 200) setConsultas(resposta.data);
      } catch (erro) {
        console.log(erro);
      }
    };
    const storedEmail = sessionStorage.getItem('email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
    const storedUsername = sessionStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
    acharConsultas();
  }, []);

  const handleDelete = async (dados) => {
    const client = mqtt.connect('wss://test.mosquitto.org:8081');
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
