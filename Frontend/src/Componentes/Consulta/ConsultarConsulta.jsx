import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

export default function ConsultarConsulta() {
  const [consultas, setConsultas] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/consulta/consultas')
      .then((response) => response.json())
      .then((data) => setConsultas(data))
      .catch((error) => console.error('Erro ao buscar consultas:', error));
  }, []);

  return (
    <>
      {consultas.length > 0 ? (
        consultas.map((consulta) => (
          <div key={consulta.id} className="card">
            <h4>Consulta</h4>
            <p>Paciente: {consulta.paciente}</p>
            <p>Data: {consulta.data}</p>
            <p>Horário: {consulta.horario}</p>
            <p>Urgência: {consulta.gravidade}</p>
          </div>
        ))
      ) : (
        <p>Carregando consultas...</p>
      )}
      <Link to='/cadastraConsulta'>Cadastrar</Link>
    </>
  );
}
