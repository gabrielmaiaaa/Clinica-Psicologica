import React, { useState } from 'react';
import { useForm } from 'react-hook-form'; //npm i react-hook-form
import { yupResolver } from "@hookform/resolvers/yup"; //npm i @hookform/resolvers
import * as yup from "yup"; //npm i yup
import axios from 'axios'; //npm i axios
import { Navigate, Link } from 'react-router-dom';
import '../CSS/Auth/Cadastro.css'

const schema = yup.object({
  username: yup.string().required('Usuário obrigatório'),
  email: yup.string().email('Email invalido').required('Email obrigatório'),
  password: yup.string().min(4, 'Senha com no mínimo 4 caracteres').required(),
  passwordConf: yup.string().required('Confirme a senha').oneOf([yup.ref('password')], 'As senhas devem ser iguais!'),
  cpf: yup.string().required('CPF é obrigatório').length(11, 'CPF deve ter 11 caracteres'),
  endereco: yup.string().required('Endereço é obrigatório'),
  telefone: yup.string().required('Telefone é obrigatório').matches(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Formato de telefone inválido'),
  idade: yup.number('Idade obrigatória').required('Idade é obrigatória').min(18, 'Idade mínima é 18 anos').max(120, 'Idade máxima é 120 anos')
}).required();

export default function CreateUser() {

  const [msg, setMsg] = useState();

  const form = useForm({
    resolver: yupResolver(schema)
  });

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  const submit = async (data) => {
    try {
      const response = await axios.post('http://localhost:3000/auth/create', data);
      if (response.status === 200)
        setMsg('OK');
    } catch (error) {
      setMsg(error.response.data);
    }
  }

  if (msg === 'OK')
    return <Navigate to='/' />

  return (
    <>
      <div className="container">
        <div className="card">  
          <h2>Criar Usuário</h2>
          <form onSubmit={handleSubmit(submit)} noValidate>
            <label htmlFor="username">Nome</label>
            <input type="text" id="username" {...register('username')} />
            <p className="erro">{errors.username?.message}</p>

            <label htmlFor="email">Email</label>
            <input type="text" id="email" {...register('email')} />
            <p className="erro">{errors.email?.message}</p>

            <label htmlFor="telefone">Telefone</label>
            <input type="text" id="telefone" {...register('telefone')} />
            <p className="erro">{errors.telefone?.message}</p>

            <label htmlFor="password">Senha</label>
            <input type="password" id="password" {...register('password')} />
            <p className="erro">{errors.password?.message}</p>

            <label htmlFor="passwordConf">Confirmar Senha</label>
            <input type="password" id="passwordConf" {...register('passwordConf')} />
            <p className="erro">{errors.passwordConf?.message}</p>

            <label htmlFor="cpf">CPF</label>
            <input type="text" id="cpf" {...register('cpf')} />
            <p className="erro">{errors.cpf?.message}</p>

            <label htmlFor="idade">Idade</label>
            <input type="number" id="idade" {...register('idade')} />
            <p className="erro">{errors.idade?.message}</p>

            <label htmlFor="endereco">Endereço</label>
            <input type="text" id="endereco" {...register('endereco')} />
            <p className="erro">{errors.endereco?.message}</p>

            <div className="buttons">
              <button type="submit">Cadastrar</button>
              <button type="button">Deletar</button>
            </div>
          </form>
          <Link to="/">Voltar</Link>
        </div>
      </div>
    </>
  );
}
