import React, { useState } from 'react'
import {set, useForm} from 'react-hook-form'; //npm i react-hook-form
import { yupResolver } from "@hookform/resolvers/yup"; //npm i @hookform/resolvers
import * as yup from "yup"; //npm i yup
import axios from 'axios';//npm i axios
import { Link, Navigate } from 'react-router-dom';
import '../CSS/Auth/Cadastro.css'

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
    try{
      const response = await axios.post('http://localhost:3000/auth/login', data);
      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('id', response.data.id);
      sessionStorage.setItem('username', response.data.username);
      sessionStorage.setItem('email', response.data.email);
      // if(response.data.admin === 1){
      //   setMsg('Admin Autenticado');
      // } else{
      //   setMsg('Usuário Autenticado');
      // }
      setMsg('Usuário Autenticado');
    } catch (error){
      setMsg(error.response.data);
    }
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
