# Classes e padrões — guia de autoria

## As dez classes principais

As classes ficam em `backend/models/`. Todas herdam de `Entidade`, que fornece `id` e o auxiliar `exigir()`. Cada classe declara seus atributos, implementa `validar()` e oferece outro método de domínio.

| Classe / arquivo | Atributos principais | Métodos |
|---|---|---|
| `Condominio.js` | nome, endereco, telefone, limite_reservas | `validar()`, `podeReservar(quantidade)` |
| `Unidade.js` | condominio_id, bloco, numero, andar | `validar()`, `identificacao()` |
| `Morador.js` | unidade_id, nome, email, telefone | `validar()`, `contato()` |
| `Comunicado.js` | condominio_id, titulo, mensagem, tipo, bloco | `validar()`, `urgente()` |
| `Visitante.js` | morador_id, nome, documento, inicio, fim | `validar()`, `dentroDaValidade(agora)` |
| `Encomenda.js` | morador_id, descricao, transportadora, tipo | `validar()`, `resumo()` |
| `AreaComum.js` | condominio_id, nome, capacidade, taxa, status | `validar()`, `comporta(pessoas)` |
| `Reserva.js` | area_id, morador_id, inicio, fim, convidados, status | `validar()`, `duracaoHoras()` |
| `Chamado.js` | morador_id, titulo, categoria, local, descricao, prioridade, prestador_id, status, relato | `validar()`, `concluido()` |
| `Prestador.js` | nome, especialidade, email, telefone, documento, contrato | `validar()`, `apresentacao()` |

**Uso real:** `backend/validation.js` seleciona a classe pelo módulo, instancia a entidade e chama `validar()` antes da gravação. O gerenciador de reservas também usa `AreaComum.comporta()` e `Condominio.podeReservar()`. Os demais auxiliares são exemplos de comportamento de domínio e nem todos são usados em toda requisição.

## Dois Singletons

Ideia: manter uma única instância de um gerenciador durante a execução do processo Node.

| Exemplo | Arquivo em `backend/patterns/singleton/` | Responsabilidade | Integração |
|---|---|---|---|
| Notificações | `NotificacaoManager.js` | Criar avisos internos para usuários, moradores e condomínios | Três Templates e ações do serviço |
| Reservas | `ReservaManager.js` | Validar período, capacidade, limite e conflitos | `validateRelations()` em `backend/service.js` |

Trecho importante:

```javascript
static #instance;
static getInstance() {
  return this.#instance || new ReservaManager();
}
```

`#instance` é privado e pertence à classe. `getInstance()` reutiliza o objeto existente. O construtor também devolve a instância anterior se alguém usar `new` novamente.

**O Singleton sozinho não impede reservas simultâneas.** A garantia vem da transação e dos `SELECT ... FOR UPDATE` no MySQL. A linha da área é travada; outra transação para a mesma área aguarda e depois enxerga o agendamento já confirmado.

## Três Template Methods

Ideia: a classe base define a sequência de um processo; as subclasses variam passos específicos. Aqui há três classes base próprias, cada uma com `executar()` e duas subclasses concretas.

| Exemplo | Arquivo em `backend/patterns/template/` | Sequência fixa | Subclasses |
|---|---|---|---|
| Comunicado | `ComunicadoTemplate.js` | Validar → persistir → notificar | `ComunicadoGeral` e `ComunicadoUrgente` |
| Chamado | `ChamadoTemplate.js` | Validar → persistir → notificar | `ChamadoManutencao` e `ChamadoOcorrencia` |
| Encomenda | `EncomendaTemplate.js` | Conferir perfil → persistir → notificar | `EncomendaPacote` e `EncomendaDocumento` |

Os métodos `titulo()` e, em alguns casos, `mensagem()` ou `orientacao()` são sobrescritos. O comunicado urgente solicita confirmação de leitura; o documento orienta a apresentação de identificação na retirada. Manutenção e ocorrência usam títulos diferentes.

`backend/service.js` escolhe a subclasse conforme o tipo/categoria e chama `executar(context, persistir)`. A função `persistir` mantém o SQL no serviço, evitando cópias dentro dos padrões. Os Templates são usados na **criação**; a edição usa as validações e a persistência do serviço.

Exemplo equivalente ao fluxo real:

```javascript
const template = data.tipo === 'urgente'
  ? new ComunicadoUrgente()
  : new ComunicadoGeral();
const id = await template.executar(context, persistir);
```

## Três Chains of Responsibility

Ideia: cada objeto é responsável por uma validação e passa o pedido ao próximo somente se a sua etapa for aceita.

| Cadeia | Arquivo em `backend/patterns/chain/` | Handlers |
|---|---|---|
| Comunicado | `ComunicadoChain.js` | Perfil do autor → conteúdo mínimo → condomínio/bloco destinatário |
| Chamado | `ChamadoChain.js` | Conteúdo → prioridade → prestador e coerência com a etapa |
| Visitante | `VisitanteChain.js` | Documento → validade → autorização do perfil/morador |

São três cadeias completas, com três handlers em cada uma. A classe base está em `Handler.js`:

```javascript
async handle(context) {
  await this.validate(context);
  if (this.next) await this.next.handle(context);
}
```

`setNext()` liga os objetos; `chain()` faz as ligações. Se `validate()` lançar um erro, os próximos handlers e a gravação não são executados.

As cadeias de comunicado e chamado são chamadas pelos Templates de criação e pelo serviço nas edições. A de visitante é chamada diretamente pelo serviço. Entrada e saída têm validações adicionais em `action()`, pois são operações distintas do cadastro de autorização.

## Como os padrões se conectam

Ao publicar um comunicado urgente:

1. O formulário envia JSON para `POST /api/comunicados`.
2. O servidor exige login e permissão de criar.
3. A classe `Comunicado` valida seus dados.
4. O serviço escolhe `ComunicadoUrgente`.
5. `executar()` chama a Chain, persiste o aviso e solicita notificações.
6. O Singleton de notificações cria avisos para moradores do condomínio/bloco.
7. A transação confirma comunicado, avisos e histórico juntos. Se ocorrer erro, faz rollback.

## Frases curtas para a defesa

- “O Singleton de notificações centraliza a criação dos avisos internos.”
- “O Singleton de reservas centraliza as regras; o MySQL protege a concorrência.”
- “No Template, a base define a sequência e as subclasses mudam passos.”
- “Na Chain, cada handler valida uma parte e só passa adiante se estiver correta.”
- “As dez entidades são instanciadas na validação antes de gravar.”
- “As permissões são conferidas no servidor, não apenas no menu.”
