# Cobertura dos requisitos e verificação

Base: documento Projeto CondoFlow (12)(1).pdf e as sete referências visuais fornecidas em 22/10/2026. A implementação usa os quatro perfis pedidos na conversa: morador, porteiro, prestador e síndico.

## Exigências da atividade

| Exigência | Entrega |
|---|---|
| Dez telas, duas CRUD por integrante | Dez módulos independentes por rota, com listagem, detalhes, inclusão, edição e exclusão |
| Ao menos dez classes com atributos e métodos | Dez classes em `backend/models/`, além das classes dos padrões |
| JavaScript, HTML e CSS | Interface sem framework; servidor JavaScript com Node e Express |
| Banco MySQL com pelo menos três tabelas | Dez tabelas de domínio e seis de suporte |
| Dois Singletons | `NotificacaoManager` e `ReservaManager` |
| Três Template Methods | Comunicado, chamado e encomenda, com duas subclasses concretas por exemplo |
| Três Chains of Responsibility | Comunicado, chamado e visitante, com três handlers por cadeia |
| Exemplo de variabilidade | Perfis, tipo dos processos e limite configurável de reservas |
| Interface baseada nas referências | Azul principal, fundos claros, cartões, badges e adaptação desktop com menu lateral |

## Banco

Tabelas de domínio: `condominios`, `unidades`, `moradores`, `comunicados`, `visitantes`, `encomendas`, `areas`, `reservas`, `chamados`, `prestadores`.

Tabelas de suporte: `usuarios`, `sessoes`, `notificacoes`, `historico`, `anexos`, `leituras`.

Relacionamentos principais:

- Condomínio possui unidades e áreas comuns.
- Unidade possui moradores.
- Morador possui visitantes, encomendas, chamados e reservas.
- Reserva referencia uma área; a regra exige o mesmo condomínio do morador.
- Chamado pode ser atribuído a um prestador.
- Morador e prestador possuem uma conta de usuário.
- Usuário possui sessões e notificações.
- Leituras relacionam usuário e comunicado.
- Histórico mantém autor, operação, registro e data, inclusive após a exclusão do registro de domínio.
- Anexos usam `recurso` e `registro_id`; a aplicação verifica o acesso e remove anexos ao excluir o registro.

## Funcionalidades do documento

| RF | Implementação |
|---|---|
| RF01 | Síndico cria comunicados, com notificações internas aos moradores |
| RF02 | Tipo urgente, destaque visual e confirmação de leitura |
| RF03 | Portaria registra encomenda vinculada ao morador/unidade |
| RF04 | Notificação interna criada na mesma transação da encomenda |
| RF05 | Retirada registra responsável e data/hora |
| RF06 | Morador autoriza visitante com QR Code e validade |
| RF07 | Portaria valida conteúdo do QR e registra entrada/saída; leitura por código, sem integração de câmera |
| RF08 | Chamado com categoria, local, descrição, prioridade e foto opcional |
| RF09 | Acompanhamento dos estados, incluindo etapa adicional de aprovação |
| RF10 | Cadastro de prestador, contrato, contato e anexos PNG/JPG/PDF |
| RF11 | Síndico atribui; prestador atualiza e envia foto de evidência |
| RF12 | Reserva com agenda de períodos ocupados, capacidade e bloqueio de sobreposição |
| RF13 | Login real, senha com scrypt, sessão em cookie HttpOnly e tabela de sessões |
| RF14 | Permissões e escopo verificados no servidor |
| RF15 | Síndico aprova/devolve conclusão com justificativa e histórico |

O aplicativo possui controles básicos de segurança, rastreabilidade e responsividade. Não foi realizada certificação de acessibilidade, adequação jurídica, carga, disponibilidade de 99% ou medição de notificação em até 15 segundos. A consulta de notificações usa intervalo de dez segundos em aba ativa; isso não é garantia de SLA.

## Testes automatizados executados

Ambiente de verificação: Node.js 24.19.0 e MySQL 8.0.46. A instalação de teste do MySQL foi usada somente para validar a entrega; os binários do servidor não fazem parte do ZIP.

### Oito testes de regras e padrões (`npm test`)

1. Identidade dos dois Singletons, inclusive quando se usa `new`.
2. Interrupção da cadeia após rejeição.
3. Cadeia de comunicado bloqueia perfil não autorizado.
4. Cadeia de chamado exige prestador nas etapas apropriadas.
5. Cadeia de visitante rejeita autorização vencida.
6. Seis subclasses dos três Templates persistem antes de notificar.
7. Filtro de campos desconhecidos e restrições de perfil.
8. Rejeição de capacidade negativa e e-mail inválido.

### Oito testes de integração com MySQL (`npm run test:integration`)

1. Exigência de login, perfil correto e permissões.
2. Criação, leitura, atualização e exclusão das **dez entidades**, com leitura direta do MySQL após editar; bloqueio de exclusão com vínculo.
3. Isolamento entre moradores e filtro de chamados do prestador.
4. Duas reservas concorrentes: uma confirmação e uma resposta de conflito.
5. Reserva recusada por manutenção, excesso de capacidade e condomínio diferente.
6. QR de visitante, código incorreto, entrada única e saída.
7. Notificação de encomenda e registro do responsável/data de retirada.
8. Evidência enviada pelo prestador, aprovação exclusiva do síndico, histórico e acesso ao anexo.

Resultado: **16 testes aprovados**. O teste dos dez CRUDs contém diversas operações e asserções dentro de um cenário.

A tela de login foi inspecionada visualmente em navegador desktop. A verificação automatizada dos fluxos autenticados foi feita pela API com banco real; não foi executada uma navegação completa por todos os formulários no navegador. O layout responsivo foi implementado em CSS, mas não foi validado em aparelhos físicos.

## Limites deliberados

- Um síndico administra globalmente esta instalação; não há SaaS com síndicos isolados entre organizações.
- Notificações são internas; sem e-mail, push do navegador ou WhatsApp.
- QR contém o código da autorização; a validação exige o login da portaria/síndico. Sem leitura automática pela câmera.
- Anexos de até 2 MB, no máximo cinco por registro, armazenados no MySQL.
- Sem integrações dos AIEs, pagamentos, boletos ou rastreamento de transportadora.
- Sem upload de vídeo e sem execução offline.
- A aplicação é acadêmica; HTTPS, backups, operação monitorada e política de retenção devem ser preparados antes de uso real.
