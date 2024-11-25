import React from 'react'
import { Link } from 'react-router-dom';

export default function PaginaInicial() {
  return (
    <>
      <Link to='/consulta'>Consulta</Link>
      <br />
      <Link to='/enviar-relato'>Gerar Relato</Link>
    </>
  )
}
