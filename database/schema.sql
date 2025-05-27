create table usuarios {
    id_usuario varchar(50) not null
    nome varchar(50) not null
    senha varchar(50) not null
    email varchar(50) not null
    data_nasc date not null
    criado_em date not null
    tipo varchar(50) not null
    telefone varchar(9) not null
    primary key(id_usuario)
}