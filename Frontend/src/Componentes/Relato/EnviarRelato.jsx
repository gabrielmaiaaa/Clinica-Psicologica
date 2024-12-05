import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import mqtt from 'mqtt';
import '../CSS/EnviarRelato.css'

export default function EnviarRelato() {
  const [relato, setRelato] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
    const storedUsername = sessionStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleSend = () => {
    const client = mqtt.connect('wss://b7f0aae8c6514adeb1fb7f81c1743e30.s1.eu.hivemq.cloud:8884/mqtt', {
      username: 'Gamaia',
      password: 'Maia1234'
    });
    const payload = JSON.stringify({
      username: username,
      email: email,
      text: relato
    });

    client.publish('relatos/enviar', payload, () => {
        console.log('Relato enviado:', relato);
        setRelato('');
    });
  };
  
  return (
    <>
    <div className="menu">
        <nav>
          <Link to="/pagina-inicial" className="menu-item">Voltar à Página Inicial</Link>
        </nav>
      </div>
      <h1>Envie seu relato Relato</h1>
    <p>Esta área é dedicada para tentar melhor a avalição dos nossos profissionais e facilitar com que você nos conte algo que esteja acontecendo com você agora ou que acabou de acontece e você gostaria de salvar para ver depois.</p>
    <textarea
        value={relato}
        onChange={(e) => setRelato(e.target.value)}
        placeholder="Descreva seu relato..."
    />
    <button onClick={handleSend}>Enviar</button>
    </>
  )
}
