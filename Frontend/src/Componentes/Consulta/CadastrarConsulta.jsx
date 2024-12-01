import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import { Navigate, Link } from "react-router-dom";

// Validação com Yup
const schema = yup.object({
  paciente: yup
    .string()
    .required("Nome do paciente é obrigatório"),
  data: yup
    .date()
    .required("Data é obrigatória"),
  horario: yup
    .string()
    .required("Horário é obrigatório"),
  gravidade: yup
    .string()
    .oneOf(["normal", "medio", "grave"], "Gravidade inválida")
    .required("Gravidade é obrigatória"),
}).required();

export default function CadastrarConsulta() {
  const [msg, setMsg] = useState();

  const form = useForm({
    resolver: yupResolver(schema),
  });

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  // Função de envio dos dados
  const submit = async (data) => {
    try {
      const response = await axios.post(
        "http://localhost:3000/consulta/cadastrarConsulta",
        data
      );
      if (response.status === 200) {
        setMsg("Consulta cadastrada com sucesso!");
      }
    } catch (error) {
      setMsg(error.response?.data || "Erro ao cadastrar consulta!");
    }
  };

  if (msg === "Consulta cadastrada com sucesso!") {
    return <Navigate to="/consultas" />;
  }

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
        <input type="date" id="data" {...register("data")} />
        <p className="erro"> {errors.data?.message} </p>

        {/* Campo: Horário */}
        <label htmlFor="horario">Horário</label>
        <input type="time" id="horario" {...register("horario")} />
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
      <Link to="/">Voltar</Link>
    </>
  );
}
