import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Navigate, Link } from "react-router-dom";
import mqtt from 'mqtt';

// Validação com Yup
const schema = yup.object({
  paciente: yup.string().required("Nome do paciente é obrigatório"),
  cpf: yup.string().required('CPF é obrigatório').length(11, 'CPF deve ter 11 caracteres'),
  cip: yup.string().required('CIP é obrigatória').length(7, 'CIP deve ter 7 caracteres'),
  data: yup.date().required("Data é obrigatória"),
  horario: yup.string().required("Horário é obrigatório"),
  gravidade: yup
    .string()
    .oneOf(["normal", "medio", "grave"], "Gravidade inválida")
    .required("Gravidade é obrigatória"),
}).required();

export default function CadastrarConsulta() {
  const [msg, setMsg] = useState();
  const [horarios, setHorarios] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [email, setEmail] = useState('');

  const form = useForm({
    resolver: yupResolver(schema),
  });
  
  const { register, handleSubmit, formState, setValue } = form;
  const { errors } = formState;

  // Função para gerar horários a cada 1 hora, com intervalos removidos
  const gerarHorarios = (dataSelecionada) => {
    const horariosDisponiveis = [];
    const agora = new Date();
    let horaAtual = agora.getHours();

    // Se a data selecionada for diferente da data de hoje, permitir todos os horários de 00:00 até 23:00
    if (dataSelecionada && dataSelecionada !== agora.toISOString().split('T')[0]) {
      horaAtual = 0; // Começar de 00:00 se for um dia futuro
    }

    // Gerar horários de 1 em 1 hora, de 00:00 até 23:00, mas excluindo os intervalos
    for (let i = horaAtual; i < 24; i++) {
      if (
        (i >= 0 && i < 8) ||  
        (i >= 12 && i < 14) || 
        (i >= 18 && i < 24)    
      ) {
        continue; // Ignorar horários dentro dos intervalos definidos
      }
      const horaFormatada = String(i).padStart(2, '0');
      horariosDisponiveis.push(`${horaFormatada}:00`);
    }
    setHorarios(horariosDisponiveis);
  };
  

  useEffect(() => {
    gerarHorarios(dataSelecionada); 
  }, [dataSelecionada]);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, [])

  // Função de envio dos dados
  const submit = async (data) => {
    const client = mqtt.connect('wss://b7f0aae8c6514adeb1fb7f81c1743e30.s1.eu.hivemq.cloud:8884/mqtt', {
      username: 'Gamaia',
      password: 'Maia1234'
    });
    const payload = JSON.stringify({
      paciente: data.paciente,
      cpf: data.cpf,
      cip: data.cip,
      data: data.data,
      horario: data.horario,
      gravidade: data.gravidade,
      email: email
    });

    console.log('Enviando dados:', payload); // Adicionando log para visibilidade

    client.publish('consulta/cadastrar', payload, () => {
      console.log('Mensagem publicada com sucesso no tópico "consulta/cadastrar"');
      setMsg("Consulta cadastrada com sucesso!");
    });
  };

  if (msg === "Consulta cadastrada com sucesso!") {
    return <Navigate to="/consultas" />;
  }

  const today = new Date().toISOString().split('T')[0]; // Data de hoje

  return (
    <>
      <h2>Cadastrar Consulta</h2>
      <form onSubmit={handleSubmit(submit)} noValidate>
        {/* Campo: Paciente */}
        <label htmlFor="paciente">Nome Completo Paciente</label>
        <input type="text" id="paciente" {...register("paciente")} />
        <p className="erro"> {errors.paciente?.message} </p>

        {/* Campo CPF */}
        <label htmlFor="cpf">CPF do Paciente</label>
        <input type="text" id='cpf' {...register('cpf')} />
        <p className='erro'> {errors.cpf?.message} </p>

        {/* Campo CIP */}
        <label htmlFor="cip">CIP do Psicologo</label>
        <input type="text" id='cip' {...register('cip')} />
        <p className='erro'> {errors.cip?.message} </p>

        {/* Campo: Data */}
        <label htmlFor="data">Data</label>
        <input 
          type="date" 
          id="data" 
          {...register("data")} 
          min={today} 
          onChange={(e) => setDataSelecionada(e.target.value)} 
        />
        <p className="erro"> {errors.data?.message} </p>

        {/* Campo: Horário */}
        <label htmlFor="horario">Horário</label>
        <select id="horario" {...register("horario")}>
          <option value="">Selecione</option>
          {horarios.map((hora, index) => (
            <option key={index} value={hora}>
              {hora}
            </option>
          ))}
        </select>
        <p className="erro"> {errors.horario?.message} </p>

        {/* Campo: Gravidade */}
        <label htmlFor="gravidade">Gravidade</label>
        <select id="gravidade" {...register("gravidade")}>
          <option value="">Selecione</option>
          <option value="normal">Normal</option>
          <option value="medio">Médio</option>
          <option value="grave">Grave</option>
        </select>
        <p className="erro"> {errors.gravidade?.message} </p>

        <button type="submit">Cadastrar</button>
      </form>

      <p className="server-response">{msg}</p>
      <Link to="/consultas">Voltar</Link>
    </>
  );
}
