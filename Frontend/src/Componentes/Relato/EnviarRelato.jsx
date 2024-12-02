import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import mqtt from 'mqtt';

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
    const client = mqtt.connect('wss://test.mosquitto.org:8081');
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
    <h1>Enviar Relato</h1>
    <textarea
        value={relato}
        onChange={(e) => setRelato(e.target.value)}
        placeholder="Descreva seu relato..."
    />
    <button onClick={handleSend}>Enviar</button>
    </>
  )
}
