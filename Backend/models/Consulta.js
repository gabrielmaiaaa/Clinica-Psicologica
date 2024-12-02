class Consulta{
    constructor(id, paciente, cpf, cip, data, horario, gravidade){
        this.id = id;
        this.paciente = paciente;
        this.cpf = cpf;;
        this.cip = cip;
        this.data = data;
        this.horario = horario;
        this.gravidade = gravidade;
    }
}
module.exports = Consulta