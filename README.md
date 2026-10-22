# CondoFlow — projeto acadêmico

Aplicação local em **HTML, CSS e JavaScript**, com servidor **Node.js + Express** e banco **MySQL**. Sem React, TypeScript, ORM ou etapa de build. Um único servidor entrega a interface e a API.

**Comece por este arquivo.** Abra a pasta do projeto no VS Code. O banco será criado no seu computador por `npm run db:setup`.

## 1. Instalar os requisitos

- Node.js **22 ou superior**.
- MySQL Server **8.0.16 ou superior** (MySQL 8.4 também é adequado), instalado e em execução.
- VS Code. MySQL Workbench é opcional: instalar apenas o Workbench não instala necessariamente o servidor.

Você precisará do usuário e senha do MySQL configurados na instalação. Essa senha é diferente da senha de login no CondoFlow.

## 2. Abrir no VS Code

1. Extraia o ZIP.
2. Use **Arquivo → Abrir Pasta** e selecione a pasta `CondoFlow-organizado`, que contém `package.json`.
3. Abra **Terminal → Novo Terminal**. Execute os comandos nessa pasta.

```powershell
node -v
npm -v
npm install
Copy-Item .env.example .env
```

No macOS/Linux, troque o último comando por `cp .env.example .env`.

## 3. Configurar o banco

Abra `.env` e preencha:

```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD="COLOQUE_AQUI_SUA_SENHA_DO_MYSQL"
DB_NAME=condoflow
COOKIE_SECURE=false
```

Ajuste host, porta e usuário se forem diferentes na sua instalação. Use a sua senha real; aspas são úteis se ela contiver espaços ou `#`. Não publique o `.env`.

Com o MySQL iniciado:

```powershell
npm run db:setup
npm start
```

Abra **http://localhost:3000**.

**Não use Live Server e não abra `index.html` diretamente:** as telas precisam da API do Node. Não precisa abrir um terminal para o front-end e outro para o back-end. O MySQL fica funcionando como serviço; `npm start` inicia a aplicação.

Para parar o Node, pressione `Ctrl+C`. Nas próximas vezes, basta iniciar o MySQL e executar `npm start`. Durante a edição, `npm run dev` reinicia o servidor automaticamente quando o código muda.

### O que o instalador faz

1. Conecta com as credenciais do `.env`.
2. Cria o banco de `DB_NAME`, se necessário.
3. Executa `backend/database/schema.sql` para criar tabelas, índices e relacionamentos.
4. Em um banco novo, executa `backend/database/seed.sql` e cria as contas com senhas protegidas por hash.
5. Se já existem usuários, preserva os dados e não duplica a carga de exemplo.

O instalador não usa `DROP DATABASE` nem apaga registros. Se houver condomínios sem usuários, ele interrompe a carga: use um `DB_NAME` vazio para a demonstração.

Alternativa pelo Workbench: execute `CREATE DATABASE condoflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`, depois `USE condoflow;` e o conteúdo de `backend/database/schema.sql`. Em seguida rode `npm run db:setup` para criar os exemplos e logins. **Não execute `seed.sql` sozinho**: ele não cria as senhas das contas.

## 4. Contas de demonstração

Senha inicial de todas as contas: **`Condo@123`**. Escolha o perfil correto na tela de login.

| Perfil | E-mail | Demonstração |
|---|---|---|
| Síndico | sindico@condoflow.com | Todas as dez telas CRUD, atribuição e aprovação de chamados |
| Morador | morador@condoflow.com | Registros do Lucas, reservas, visitantes, chamados e avisos |
| Porteiro | porteiro@condoflow.com | Visitantes e encomendas do condomínio |
| Prestador de serviço | prestador@condoflow.com | Chamados atribuídos ao Marcos |
| Outra moradora | ana@condoflow.com | Isolamento em relação ao Lucas; selecione Morador |

Os dados são fictícios. Clique no nome da conta no canto superior direito para trocar a senha. No cadastro de morador ou prestador, o síndico define uma senha inicial e o e-mail vira o login. Na edição, deixar a senha em branco mantém a anterior.

Para demonstrar perfis simultâneos, use navegadores diferentes ou janelas anônimas separadas. Abas do mesmo navegador compartilham a sessão.

## 5. Dez telas CRUD: duas por integrante

Cada módulo tem listagem/consulta, inclusão, edição e exclusão. Formulários e detalhes abrem sobre a tela. Login, painel, notificações e conta são extras e não entram na contagem.

| Integrante sugerido | Tela 1 | Tela 2 | Classes |
|---|---|---|---|
| Eduardo Monteiro | Condomínios | Unidades | `Condominio`, `Unidade` |
| João Bringmann | Visitantes | Encomendas | `Visitante`, `Encomenda` |
| Leonardo Grattão | Áreas comuns | Reservas | `AreaComum`, `Reserva` |
| Matheus Arruda | Chamados | Prestadores | `Chamado`, `Prestador` |
| Caio Henrique | Moradores | Comunicados | `Morador`, `Comunicado` |

A divisão é uma sugestão baseada nos módulos do projeto. **Entre como síndico para demonstrar o CRUD completo das dez telas.** Os demais perfis têm ações reduzidas por regra de negócio.

Páginas: `/telas/condominios.html`, `/telas/unidades.html`, `/telas/moradores.html`, `/telas/comunicados.html`, `/telas/visitantes.html`, `/telas/encomendas.html`, `/telas/areas.html`, `/telas/reservas.html`, `/telas/chamados.html` e `/telas/prestadores.html`.

## 6. Onde fica cada parte

```text
frontend/                  telas que rodam no navegador
├── index.html             entrada principal
├── telas/                 uma página HTML para cada módulo CRUD
├── css/styles.css         aparência e responsividade
└── js/                    comportamento compartilhado e por tela
    ├── crud.js             operações comuns de consulta e gravação
    ├── login.js            autenticação do usuário
    ├── schema.js           reúne configurações usadas pelo backend
    └── telas/              reservas.js, visitantes.js, chamados.js...
backend/                   servidor Node.js, regras e conexão MySQL
├── server.js              rotas HTTP e entrega dos arquivos frontend
├── db.js                  conexão e transações MySQL
├── service.js             operações CRUD e regras de negócio
├── models/                classes de domínio
├── patterns/              padrões de projeto
├── database/              schema.sql e seed.sql
├── scripts/setup-db.js    prepara o banco de demonstração
└── tests/                 testes
```

Cada arquivo em `frontend/telas/` contém o HTML completo do módulo, incluindo os campos do formulário, os títulos e as colunas da tabela. Por exemplo, `frontend/telas/reservas.html` contém o formulário e a tabela de reservas. O arquivo `frontend/js/telas/reservas.js` cuida das interações e da agenda; `frontend/js/crud.js` compartilha as operações comuns de consulta, cadastro, edição e exclusão.

O servidor entrega os arquivos de `frontend/` e recebe as chamadas `/api`. Fluxo: **HTML da tela → JavaScript do módulo e crud.js → rota em backend/server.js → regras em backend/service.js → MySQL**.

## 7. Regras importantes

- O síndico é o administrador global dos condomínios desta instalação acadêmica.
- O porteiro gerencia visitantes e encomendas do condomínio ao qual sua conta está vinculada.
- O morador só acessa seus visitantes, reservas, chamados e encomendas. Consulta avisos e áreas do seu condomínio.
- O prestador só vê chamados atribuídos a ele; envia conclusão, mas não aprova o próprio serviço.
- Reservas verificam período futuro, capacidade, disponibilidade, limite de reservas e conflito. Transações e locks MySQL protegem solicitações simultâneas. Horários adjacentes são permitidos.
- Na edição de reserva, área e morador permanecem fixos. Para trocá-los, exclua e crie outra reserva. Datas e convidados podem ser alterados antes do início.
- A portaria valida o conteúdo do QR Code de visitante, recebido por leitor ou digitado/colado no campo. Não há abertura automática da câmera.
- A retirada da encomenda registra nome do responsável, data/hora e histórico.
- Para solicitar aprovação, o prestador envia relato e uma **nova foto**; o síndico aprova ou devolve com justificativa.
- O banco impede excluir registros que ainda têm dependências, como uma unidade com moradores.
- Notificações são internas, atualizadas a cada 10 segundos enquanto a aba está ativa. Não são e-mails nem WhatsApp.

## 8. Testar

Regras e padrões, sem precisar de banco:

```powershell
npm test
```

Integração: use um **banco separado**, no PowerShell:

```powershell
$env:DB_NAME = "condoflow_test"
npm run db:setup
npm run test:integration
Remove-Item Env:DB_NAME
```

O teste exige um nome terminado em `_test`. Cria registros próprios e remove os registros de cada fluxo concluído. Históricos e notificações permanecem no banco de testes; uma falha no meio também pode deixar registros daquele teste. Não use o banco da apresentação.

## 9. Problemas comuns

| Sintoma | Solução |
|---|---|
| `npm` não reconhecido | Instale Node.js e reabra o VS Code |
| PowerShell bloqueia `npm.ps1` | Use `npm.cmd install`, `npm.cmd start` etc. ou o Prompt de Comando |
| `.env` não encontrado | Execute `Copy-Item .env.example .env` na pasta correta |
| `ECONNREFUSED` | Inicie o MySQL e confira host/porta |
| `ER_ACCESS_DENIED_ERROR` | Confira usuário/senha do MySQL |
| Banco ou tabela inexistente | Execute `npm run db:setup` |
| `EADDRINUSE` | Pare o servidor anterior ou altere `PORT=3001` e abra a nova porta |
| Login recusado | Confira e-mail, senha e perfil escolhido |
| CSS não atualiza | Recarregue com `Ctrl+F5` |
| Exclusão recusada | Remova os vínculos antes ou confira as restrições de etapa |

## 10. Limites desta entrega

O foco é um projeto acadêmico funcional e compreensível. Não inclui integrações externas de previsão do tempo, boletos ou transportadoras, envio de e-mail, leitura de QR pela câmera, operação offline, teste de carga ou comprovação de disponibilidade de produção. Anexos ficam no MySQL: até 2 MB por arquivo e cinco por registro.

A interface adapta as referências móveis para desktop com menu lateral, cartões claros e azul principal. Para operação real, ainda seria necessário preparar hospedagem, HTTPS, backups, governança dos dados e monitoramento.

Referências técnicas: [Express](https://expressjs.com/en/starter/static-files/), [MySQL2](https://sidorares.github.io/node-mysql2/docs), [MySQL](https://dev.mysql.com/doc/refman/8.0/en/).
