import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Navigate, Link } from "react-router-dom";
import mqtt from 'mqtt';

// Validação com Yup
const schema = yup.object({
  paciente: yup.string().required("Nome do paciente é obrigatório"),
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
    let minutoAtual = agora.getMinutes();

    // Se a data selecionada for diferente da data de hoje, permitir todos os horários de 00:00 até 23:00
    if (dataSelecionada && dataSelecionada !== agora.toISOString().split('T')[0]) {
      horaAtual = 0; // Começar de 00:00 se for um dia futuro
    }

    // Gerar horários de 1 em 1 hora, de 00:00 até 23:00, mas excluindo os intervalos
    for (let i = horaAtual; i < 24; i++) {
      if (
        (i >= 0 && i < 8) ||   // Excluindo das 00h às 08h
        (i >= 12 && i < 14) || // Excluindo das 12h às 14h
        (i >= 18 && i < 24)    // Excluindo das 18h às 23h
      ) {
        continue; // Ignorar horários dentro dos intervalos definidos
      }
      const horaFormatada = String(i).padStart(2, '0');
      horariosDisponiveis.push(`${horaFormatada}:00`);
    }

    setHorarios(horariosDisponiveis);
  };

  useEffect(() => {
    gerarHorarios(dataSelecionada); // Chama a função ao carregar o componente ou mudar a data
  }, [dataSelecionada]);

  // Função de envio dos dados
  const submit = async (data) => {
    const client = mqtt.connect('wss://test.mosquitto.org:8081');
    const payload = JSON.stringify({
      paciente: data.paciente,
      data: data.data,
      horario: data.horario,
      gravidade: data.gravidade
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
