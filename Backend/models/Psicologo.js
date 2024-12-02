class Psicologo {

    constructor(id, username, email, password, cpf, endereco, telefone, cip) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.cpf = cpf;
        this.endereco = endereco;
        this.telefone = telefone;
        this.cip = cip;
    }
  }
  
  module.exports = Psicologo;