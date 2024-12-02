class User {

    constructor(id, username, email, password, cpf, endereco, telefone, idade) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.cpf = cpf;
        this.endereco = endereco;
        this.telefone = telefone;
        this.idade = idade;
    }
  }
  
  module.exports = User;