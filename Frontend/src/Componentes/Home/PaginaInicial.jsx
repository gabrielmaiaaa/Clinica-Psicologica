import React from 'react';
import { Link } from 'react-router-dom';
import '../CSS/PaginaInicial.css';

export default function PaginaInicial() {
  return (
    <div className="pagina-inicial">
      <header className="menu">
        <nav>
          <Link to="/consultas" className="menu-item">Consultas</Link>
          <Link to="/enviar-relato" className="menu-item">Enviar Relatos</Link>
          <Link to="/cadastrarAdmin" className="menu-item">Cadastrar Psicólogos</Link>
        </nav>
      </header>
      <main className="conteudo">
        <h1>Seja Bem-Vindo à Clínica Psiquiátrica</h1>
        <p>
          Estamos aqui para apoiar sua saúde mental com dedicação e cuidado. Localizada na Rua das Acácias, Bairro Jardim Verde, nossa clínica tem como missão facilitar a comunicação e oferecer um ambiente acolhedor para nossos pacientes.
        </p>
        <p>
          Nosso site foi desenvolvido para atender às suas necessidades, proporcionando informações e serviços de forma prática e acessível.
        </p>
        <p>
          <b>
            Conheça mais sobre nós e descubra como podemos ajudar você a cuidar da sua saúde mental!
          </b>
        </p>
      </main>
    </div>
  );
}
