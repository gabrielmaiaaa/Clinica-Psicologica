import React from 'react'
import { Link } from 'react-router-dom';

export default function PaginaInicial() {
  return (
    <>
      <Link to='/consultas'>Consulta</Link>
      <br />
      <Link to='/enviar-relato'>Gerar Relato</Link>
      <br />
      <Link to='/cadastrarAdmin'>Cadastrar Admin</Link>
    </>
  )
}
