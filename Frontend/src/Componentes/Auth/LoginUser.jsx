import React, { useState } from 'react'
import {set, useForm} from 'react-hook-form'; //npm i react-hook-form
import { yupResolver } from "@hookform/resolvers/yup"; //npm i @hookform/resolvers
import * as yup from "yup"; //npm i yup
import axios from 'axios';//npm i axios
import { Link, Navigate } from 'react-router-dom';
import '../CSS/Auth/Cadastro.css'
import mqtt from 'mqtt';

const schema = yup.object({
  email: yup.string().email('Email inválida').required('Email obrigatório'),
  password: yup.string().min(4, 'A senha tem que ter 4 caracteres').required(),
}).required();

export default function LoginUser() {
  
  const [msg, setMsg] = useState(' ');

  const form = useForm({
    resolver: yupResolver(schema)
  });

  const {register, handleSubmit, formState} = form;

  const {errors} = formState;
  console.log(errors);

  const submit = async (data) => {
    const client = mqtt.connect('mqtt://192.168.141.62:1883');
    
    const payload = JSON.stringify({
      email: data.email,
      password: data.password
    })
  
    client.on('connect', () => {
      console.log('Conectado ao broker MQTT via WebSocket');
      client.subscribe('auth/Autorizacao', (err) => {
        if (err) {
          console.log('Erro ao subscrever no tópico:', err);
        } else {
          console.log('Inscrito no tópico auth/Autorizacao');
        }
      });
    });
  
    client.on('message', (topico, message) => {
      if (topico === 'auth/Autorizacao') {
        const dados = JSON.parse(message.toString());

        sessionStorage.setItem('token', dados.token);
        sessionStorage.setItem('id', dados.id);
        sessionStorage.setItem('username', dados.username);
        sessionStorage.setItem('email', dados.email);
        console.log('Dados recebidos:', dados);
        if(dados.email === data.email)
          setMsg('Usuário Autenticado');
      }
    });
  
    // Publicar mensagem no tópico
    client.publish('auth/login', payload, () => {
      console.log('Solicitação enviada ao tópico consulta/excluirConsulta');
    });
  }

  if(msg.includes('Admin Autenticado'))
    return <Navigate to='/pagina-inicial'/>;

  if(msg.includes('Usuário Autenticado'))
    return <Navigate to='/pagina-inicial'/>;

  return (
    <>
      <div className="container">
        <div className="card">
          <h2>Realizar Login</h2>
          <form onSubmit={handleSubmit(submit)} noValidate>
            <label htmlFor="email">Email</label>
            <input type="text" id="email" {...register('email')} />
            <p className="erro">{errors.email?.message}</p>

            <label htmlFor="password">Senha</label>
            <input type="password" id="password" {...register('password')} />
            <p className="erro">{errors.password?.message}</p>

            <div>
              <button type="submit">Entrar</button>
              <Link to="/cadastro">
                <button type="button">Cadastrar</button>
              </Link>
            </div>
          </form>
          <p className="server-response">{msg}</p>
        </div>
      </div>

    </>
  )
}
