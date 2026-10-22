# Roteiro de apresentação

## Preparação

1. Inicie o MySQL.
2. Abra a pasta `condoflow` no VS Code.
3. Execute `npm start` e abra `http://localhost:3000`.
4. Deixe `docs/PADROES-E-CLASSES.md` aberto para localizar os arquivos.
5. Use dados fictícios nas demonstrações.

## Mostrar o projeto

Explique: “O CondoFlow centraliza as atividades do condomínio. A interface é HTML, CSS e JavaScript. O servidor também é JavaScript e grava no MySQL. Temos quatro perfis, dez módulos CRUD e oito exemplos de padrões.”

Entre como `sindico@condoflow.com`, senha `Condo@123`, perfil Síndico. Mostre os dez módulos. O painel inicial não entra na contagem de CRUDs.

## Dois CRUDs por integrante

| Integrante | Demonstração sugerida |
|---|---|
| Eduardo | Crie um condomínio temporário e uma unidade nele. Consulte, edite e exclua primeiro a unidade, depois o condomínio. |
| João | Crie visitante com autorização futura e encomenda para Lucas. Consulte e edite. Exclua antes de registrar entrada ou retirada, para demonstrar o CRUD sem restrição de etapa. |
| Leonardo | Crie área no condomínio do Lucas e uma reserva futura. Consulte e edite datas ou convidados. Exclua primeiro a reserva e depois a área. |
| Matheus | Crie prestador com e-mail novo e senha inicial. Crie chamado aberto, consulte e edite. Exclua primeiro o chamado e depois o prestador. |
| Caio | Crie morador em unidade existente, com e-mail novo e senha inicial. Publique comunicado, consulte, edite e exclua. Exclua o morador temporário após remover vínculos. |

Cada demonstração deve mostrar criar, consultar, atualizar e excluir. Recarregue a página depois de salvar para evidenciar persistência. No Workbench, `SELECT * FROM nome_da_tabela;` também confirma os registros.

## Demonstrar os perfis

### Morador

Entre com `morador@condoflow.com` e perfil Morador. Cadastre visitante com período incluindo o horário atual, abra os detalhes e mostre o QR Code. Crie um chamado. Em Reservas, selecione a área para consultar horários ocupados. Mostre que os cadastros administrativos não estão disponíveis.

### Porteiro

Entre com `porteiro@condoflow.com` e perfil Porteiro. Abra o visitante e use “Validar código e registrar entrada”, informando o conteúdo do QR. Depois registre a saída e mostre os horários. Cadastre uma encomenda e registre a retirada com o nome do responsável.

### Síndico e prestador

1. Como síndico, edite o chamado para atribuir Marcos Ferreira.
2. Entre com `prestador@condoflow.com`, perfil Prestador.
3. Edite o chamado para “Em execução”.
4. Edite novamente para “Aguardando aprovação”, descreva o serviço em pelo menos 10 caracteres e anexe uma nova foto PNG/JPG de até 2 MB.
5. Volte como síndico, abra os detalhes e aprove ou devolva com justificativa.
6. Mostre o histórico com a decisão.

## Mostrar os padrões

1. Abra os dois arquivos de `backend/patterns/singleton/`: explique `static #instance` e `getInstance()`.
2. Nos três arquivos de `backend/patterns/template/`, mostre a sequência de `executar()` e as subclasses.
3. Nos três arquivos de cadeias em `backend/patterns/chain/`, mostre os handlers ligados.
4. Use a busca do VS Code para localizar as chamadas em `backend/service.js`.
5. Abra uma das classes de `backend/models/` e explique atributos, `validar()` e método de domínio.

## Mostrar variabilidade

Use o exemplo de `docs/VARIABILIDADE.md`: altere o limite para uma reserva, tente criar uma segunda e depois aumente o limite para três. Mostre também as ações diferentes do morador, prestador e síndico sobre o mesmo chamado.

## Evidências finais

Execute `npm test`. Se preparou o banco separado, rode a integração como explicado no README. Mostre as dez tabelas de domínio em `backend/database/schema.sql` e as tabelas de suporte.

Não apresente como implementados: envio de e-mail, WhatsApp, operação offline, SLA de produção ou integração com transportadoras.
