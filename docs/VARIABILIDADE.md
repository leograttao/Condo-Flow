# Planejamento da variabilidade

Variabilidade é a parte que pode mudar de maneira planejada, mantendo uma estrutura comum. Neste projeto, ela aparece nos perfis, nos tipos de processo e nas configurações do condomínio.

## Partes comuns e pontos de variação

| Parte | Comum | Variação | Implementação |
|---|---|---|---|
| Acesso | Login, sessão e menu | Permissões de cada perfil | `backend/policy.js`, `frontend/login.html` e os arquivos `frontend/js/telas/` |
| Chamados | Cadastro, acompanhamento e histórico | Solicitante, executor e aprovador | Escopo e restrições no servidor |
| Comunicados | Validar, gravar e notificar | Geral ou urgente | Subclasses do Template |
| Encomendas | Receber, avisar e retirar | Pacote ou documento | Subclasses do Template |
| Reservas | Verificar horário e capacidade | Limite de reservas ativas por morador | Campo no condomínio e `ReservaManager` |
| Formulários | Operações CRUD compartilhadas | Campos e estrutura HTML de cada módulo | `frontend/telas/`, `frontend/js/telas/` e `frontend/js/crud.js` |

## Variação por perfil

| Recurso | Síndico | Morador | Porteiro | Prestador |
|---|---|---|---|---|
| Condomínios, unidades, moradores e prestadores | CRUD | Sem gestão | Sem gestão | Sem gestão |
| Comunicados | CRUD e consulta das leituras | Consulta e confirma leitura | Consulta e confirma leitura | Sem acesso |
| Visitantes | CRUD, entrada e saída | CRUD dos próprios autorizados | CRUD, entrada e saída no condomínio | Sem acesso |
| Encomendas | CRUD e retirada | Consulta das próprias | CRUD e retirada no condomínio | Sem acesso |
| Áreas comuns | CRUD | Consulta no condomínio | Sem acesso | Sem acesso |
| Reservas | CRUD | CRUD das próprias antes do início | Sem acesso | Sem acesso |
| Chamados | CRUD, atribui e aprova/devolve | Cria e consulta; edita/exclui os próprios enquanto abertos | Sem acesso | Consulta e atualiza os atribuídos |

CRUD significa criar, consultar, atualizar e excluir. Alguns estados limitam alteração/exclusão para preservar o fluxo. Chaves estrangeiras impedem a exclusão de registros ainda vinculados a outros.

## Exemplo 1: o mesmo chamado com ações diferentes

**Planejamento:** compartilhar a solicitação sem permitir que todos façam todas as ações. Morador solicita, prestador executa e síndico aprova.

**Implementação:**

- `permissions` define as operações de cada recurso/perfil.
- `scope()` acrescenta filtro SQL por `morador_id`, `prestador_id` ou condomínio.
- `constrainData()` impede o prestador de mudar solicitante ou forçar status resolvido.
- `action()` restringe aprovação ao síndico, com justificativa.
- A interface usa as permissões para mostrar ações coerentes.

**Demonstração:** morador abre → síndico atribui → prestador envia relato e foto → síndico aprova ou devolve. O registro e a tela são os mesmos; as capacidades variam por perfil.

## Exemplo 2: limite de reservas por condomínio

**Planejamento:** um condomínio pode aceitar três reservas ativas por morador, outro apenas uma. Isso deve ser configurável sem editar código.

**Implementação:** `condominios.limite_reservas` é editável na tela Condomínios. `Condominio.podeReservar()` compara a quantidade ao limite; `ReservaManager` aplica a regra dentro da transação.

**Demonstração:**

1. Como síndico, altere o limite do condomínio para `1`.
2. Lucas já possui uma reserva futura nos dados de exemplo.
3. Como morador, tente uma segunda reserva em um horário livre: o sistema recusa.
4. Volte como síndico e altere o limite para `3`.
5. Repita a tentativa: ela poderá ser aceita se horário, capacidade e disponibilidade também forem válidos.

O ponto variável é o limite; o processo de reserva permanece comum. Isso demonstra uma variação planejada em execução.

## Exemplo 3: comunicado geral ou urgente

O campo `tipo` escolhe `ComunicadoGeral` ou `ComunicadoUrgente`. Ambos seguem validar → persistir → notificar. O urgente muda a mensagem, pede confirmação de leitura e recebe indicação vermelha na interface. As confirmações ficam em `leituras`.
