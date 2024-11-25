class Consulta{
    constructor(id, paciente, data, horario, gravidade){
        this.id = id;
        this.paciente = paciente;
        this.data = data;
        this.horario = horario;
        this.gravidade = gravidade;
    }
}
module.exports = Consulta