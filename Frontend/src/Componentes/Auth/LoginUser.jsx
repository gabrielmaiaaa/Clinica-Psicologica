import React from 'react'
import { Link } from 'react-router-dom';

export default function LoginUser() {
  return (
    <>
      <Link to='/cadastro'>Cadastrar</Link>
      <br />
      <Link to='/pagina-inicial'>Acessar site</Link>
    </>
  )
}
