-- Execute com npm run db:setup (cria o banco usando o nome do .env).
-- Alternativa: crie e selecione condoflow no Workbench antes de executar este arquivo.
CREATE TABLE IF NOT EXISTS condominios (
 id INT PRIMARY KEY AUTO_INCREMENT, nome VARCHAR(180) NOT NULL, endereco VARCHAR(180) NOT NULL,
 telefone VARCHAR(180) NOT NULL, limite_reservas INT NOT NULL DEFAULT 3,
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CHECK (limite_reservas BETWEEN 1 AND 30)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS unidades (
 id INT PRIMARY KEY AUTO_INCREMENT, condominio_id INT NOT NULL, bloco VARCHAR(180) NOT NULL,
 numero VARCHAR(180) NOT NULL, andar INT NOT NULL DEFAULT 0, criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (condominio_id) REFERENCES condominios(id), UNIQUE (condominio_id,bloco,numero)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS moradores (
 id INT PRIMARY KEY AUTO_INCREMENT, unidade_id INT NOT NULL, nome VARCHAR(180) NOT NULL,
 email VARCHAR(180) NOT NULL UNIQUE, telefone VARCHAR(180) NOT NULL,
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (unidade_id) REFERENCES unidades(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS prestadores (
 id INT PRIMARY KEY AUTO_INCREMENT, nome VARCHAR(180) NOT NULL, especialidade VARCHAR(180) NOT NULL,
 email VARCHAR(180) NOT NULL UNIQUE, telefone VARCHAR(180) NOT NULL, documento VARCHAR(180) NOT NULL,
 contrato TEXT, criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS usuarios (
 id INT PRIMARY KEY AUTO_INCREMENT, nome VARCHAR(180) NOT NULL, email VARCHAR(180) NOT NULL UNIQUE,
 senha_hash VARCHAR(200) NOT NULL, perfil ENUM('sindico','morador','porteiro','prestador') NOT NULL,
 morador_id INT UNIQUE, prestador_id INT UNIQUE, condominio_id INT,
 FOREIGN KEY (morador_id) REFERENCES moradores(id) ON DELETE CASCADE,
 FOREIGN KEY (prestador_id) REFERENCES prestadores(id) ON DELETE CASCADE,
 FOREIGN KEY (condominio_id) REFERENCES condominios(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS comunicados (
 id INT PRIMARY KEY AUTO_INCREMENT, condominio_id INT NOT NULL, titulo VARCHAR(180) NOT NULL,
 mensagem TEXT NOT NULL, tipo ENUM('geral','urgente') NOT NULL DEFAULT 'geral', bloco VARCHAR(180),
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (condominio_id) REFERENCES condominios(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS visitantes (
 id INT PRIMARY KEY AUTO_INCREMENT, morador_id INT NOT NULL, nome VARCHAR(180) NOT NULL,
 documento VARCHAR(180) NOT NULL, inicio DATETIME NOT NULL, fim DATETIME NOT NULL,
 status ENUM('autorizado','entrou','saiu') NOT NULL DEFAULT 'autorizado', codigo VARCHAR(64) NOT NULL UNIQUE,
 entrada_em DATETIME, saida_em DATETIME, criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (morador_id) REFERENCES moradores(id), CHECK (fim > inicio)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS encomendas (
 id INT PRIMARY KEY AUTO_INCREMENT, morador_id INT NOT NULL, descricao VARCHAR(180) NOT NULL,
 transportadora VARCHAR(180) NOT NULL, tipo ENUM('pacote','documento') NOT NULL,
 status ENUM('pendente','retirada') NOT NULL DEFAULT 'pendente', retirado_por VARCHAR(180),
 retirada_em DATETIME, criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (morador_id) REFERENCES moradores(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS areas (
 id INT PRIMARY KEY AUTO_INCREMENT, condominio_id INT NOT NULL, nome VARCHAR(180) NOT NULL,
 capacidade INT NOT NULL, taxa DECIMAL(10,2) NOT NULL DEFAULT 0,
 status ENUM('disponivel','manutencao') NOT NULL DEFAULT 'disponivel',
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (condominio_id) REFERENCES condominios(id),
 CHECK (capacidade > 0), CHECK (taxa >= 0)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS reservas (
 id INT PRIMARY KEY AUTO_INCREMENT, area_id INT NOT NULL, morador_id INT NOT NULL,
 inicio DATETIME NOT NULL, fim DATETIME NOT NULL, convidados INT NOT NULL,
 status ENUM('confirmada','cancelada') NOT NULL DEFAULT 'confirmada',
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (area_id) REFERENCES areas(id), FOREIGN KEY (morador_id) REFERENCES moradores(id),
 INDEX ix_reservas_periodo(area_id,status,inicio,fim), CHECK (fim > inicio), CHECK (convidados > 0)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS chamados (
 id INT PRIMARY KEY AUTO_INCREMENT, morador_id INT NOT NULL, titulo VARCHAR(180) NOT NULL,
 categoria ENUM('manutencao','ocorrencia') NOT NULL, local VARCHAR(180) NOT NULL, descricao TEXT NOT NULL,
 prioridade ENUM('baixa','media','alta') NOT NULL DEFAULT 'media', prestador_id INT,
 status ENUM('aberto','em_analise','atribuido','em_execucao','aguardando_aprovacao','resolvido') NOT NULL DEFAULT 'aberto',
 relato TEXT, criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (morador_id) REFERENCES moradores(id), FOREIGN KEY (prestador_id) REFERENCES prestadores(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS sessoes (
 token_hash CHAR(64) PRIMARY KEY, usuario_id INT NOT NULL, expira_em DATETIME NOT NULL,
 FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS notificacoes (
 id INT PRIMARY KEY AUTO_INCREMENT, usuario_id INT NOT NULL, titulo VARCHAR(180) NOT NULL,
 mensagem TEXT NOT NULL, lida BOOLEAN NOT NULL DEFAULT FALSE, criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS historico (
 id INT PRIMARY KEY AUTO_INCREMENT, usuario_id INT, recurso VARCHAR(40) NOT NULL, registro_id INT NOT NULL,
 acao VARCHAR(40) NOT NULL, detalhes TEXT, criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
 INDEX ix_historico_registro(recurso,registro_id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS anexos (
 id INT PRIMARY KEY AUTO_INCREMENT, recurso VARCHAR(40) NOT NULL, registro_id INT NOT NULL,
 nome VARCHAR(180) NOT NULL, mime VARCHAR(40) NOT NULL, conteudo MEDIUMBLOB NOT NULL,
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX ix_anexos_registro(recurso,registro_id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS leituras (
 comunicado_id INT NOT NULL, usuario_id INT NOT NULL, lido_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (comunicado_id,usuario_id), FOREIGN KEY (comunicado_id) REFERENCES comunicados(id) ON DELETE CASCADE,
 FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;
