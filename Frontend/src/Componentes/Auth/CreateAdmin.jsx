import React, { useState } from 'react';
import { useForm } from 'react-hook-form'; //npm i react-hook-form
import { yupResolver } from "@hookform/resolvers/yup"; //npm i @hookform/resolvers
import * as yup from "yup"; //npm i yup
import axios from 'axios'; //npm i axios
import { Navigate, Link } from 'react-router-dom';

const schema = yup.object({
  username: yup.string().required('Usuário obrigatório'),
  email: yup.string().email('Email invalido').required('Email obrigatório'),
  password: yup.string().min(4, 'Senha com no mínimo 4 caracteres').required(),
  passwordConf: yup.string().required('Confirme a senha').oneOf([yup.ref('password')], 'As senhas devem ser iguais!'),
  cpf: yup.string().required('CPF é obrigatório').length(11, 'CPF deve ter 11 caracteres'),
  endereco: yup.string().required('Endereço é obrigatório'),
  telefone: yup.string().required('Telefone é obrigatório').matches(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Formato de telefone inválido'),
  cip: yup.string().required('CIP é obrigatória').length(7, 'CIP deve ter 7 caracteres'),
}).required();

export default function CreateAdmin() {

  const [msg, setMsg] = useState();

  const form = useForm({
    resolver: yupResolver(schema)
  });

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  const submit = async (data) => {
    try {
      const response = await axios.post('http://localhost:3000/psicologo/createPsicologo', data);
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
      <h2>Cadastrar Psicologo</h2>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <label htmlFor="username">Nome</label>
        <input type="text" id='username' {...register('username')} />
        <p className='erro'> {errors.username?.message} </p>

        <label htmlFor="email">Email</label>
        <input type="text" id='email' {...register('email')} />
        <p className='erro'> {errors.email?.message} </p>

        <label htmlFor="password">Senha</label>
        <input type="password" id='password' {...register('password')} />
        <p className='erro'> {errors.password?.message} </p>

        <label htmlFor="passwordConf">Confirmar Senha</label>
        <input type="password" id='passwordConf' {...register('passwordConf')} />
        <p className='erro'> {errors.passwordConf?.message} </p>

        {/* Campo CPF */}
        <label htmlFor="cpf">CPF</label>
        <input type="text" id='cpf' {...register('cpf')} />
        <p className='erro'> {errors.cpf?.message} </p>

        {/* Campo Endereço */}
        <label htmlFor="endereco">Endereço</label>
        <input type="text" id='endereco' {...register('endereco')} />
        <p className='erro'> {errors.endereco?.message} </p>

        {/* Campo Telefone */}
        <label htmlFor="telefone">Telefone</label>
        <input type="text" id='telefone' {...register('telefone')} />
        <p className='erro'> {errors.telefone?.message} </p>

        {/* Campo CIP */}
        <label htmlFor="cip">CIP</label>
        <input type="text" id='cip' {...register('cip')} />
        <p className='erro'> {errors.cip?.message} </p>

        <button>Registrar</button>
      </form>
      <p className='server-response'>{msg}</p>
      <Link to='/'>Voltar</Link>
    </>
  );
}
