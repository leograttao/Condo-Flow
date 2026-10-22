import test from "node:test";
import assert from "node:assert/strict";
import { NotificacaoManager } from "../patterns/singleton/NotificacaoManager.js";
import { ReservaManager } from "../patterns/singleton/ReservaManager.js";
import { chain, Handler } from "../patterns/chain/Handler.js";
import { comunicadoChain } from "../patterns/chain/ComunicadoChain.js";
import { chamadoChain } from "../patterns/chain/ChamadoChain.js";
import { visitanteChain } from "../patterns/chain/VisitanteChain.js";
import {
  ComunicadoGeral,
  ComunicadoUrgente,
} from "../patterns/template/ComunicadoTemplate.js";
import {
  ChamadoManutencao,
  ChamadoOcorrencia,
} from "../patterns/template/ChamadoTemplate.js";
import {
  EncomendaPacote,
  EncomendaDocumento,
} from "../patterns/template/EncomendaTemplate.js";
import { validateData } from "../validation.js";
import { allow, constrainData } from "../policy.js";

test("os dois Singletons preservam identidade, inclusive usando new", () => {
  for (const Type of [NotificacaoManager, ReservaManager])
    assert.equal(new Type(), Type.getInstance());
});
test("a cadeia interrompe as próximas etapas ao rejeitar uma validação", async () => {
  const steps = [];
  class First extends Handler {
    async validate() {
      steps.push(1);
    }
  }
  class Reject extends Handler {
    async validate() {
      steps.push(2);
      throw new Error("rejeitado");
    }
  }
  class Last extends Handler {
    async validate() {
      steps.push(3);
    }
  }
  await assert.rejects(
    chain(new First(), new Reject(), new Last()).handle({}),
    /rejeitado/,
  );
  assert.deepEqual(steps, [1, 2]);
});
test("cadeia de comunicado bloqueia perfil não autorizado", async () => {
  await assert.rejects(
    comunicadoChain().handle({ user: { perfil: "morador" } }),
    /síndico/,
  );
});
test("cadeia de chamado exige prestador nas etapas de execução", async () => {
  await assert.rejects(
    chamadoChain().handle({
      data: {
        titulo: "Teste de chamado",
        descricao: "Descrição completa",
        prioridade: "alta",
        status: "em_execucao",
      },
    }),
    /prestador/,
  );
});
test("cadeia de visitante rejeita autorização vencida", async () => {
  await assert.rejects(
    visitanteChain().handle({
      data: {
        documento: "123456",
        inicio: "2020-01-01 10:00:00",
        fim: "2020-01-01 11:00:00",
      },
    }),
    /venceu/,
  );
});
test("os três Templates persistem antes de notificar e variam a mensagem", async () => {
  for (const Type of [
    ComunicadoGeral,
    ComunicadoUrgente,
    ChamadoManutencao,
    ChamadoOcorrencia,
    EncomendaPacote,
    EncomendaDocumento,
  ]) {
    const steps = [],
      template = new Type();
    template.notificacoes = {
      paraMorador: async () => steps.push("notificar"),
      paraCondominio: async () => steps.push("notificar"),
    };
    const context = {
      user: { perfil: "sindico" },
      data: {
        titulo: "Título de exemplo",
        mensagem: "Mensagem de exemplo",
        descricao: "Descrição de exemplo",
        prioridade: "media",
        status: "aberto",
        morador_id: 1,
      },
      connection: { execute: async () => [[]] },
    };
    const result = await template.executar(context, async () => {
      steps.push("persistir");
      return 42;
    });
    assert.equal(result, 42);
    assert.deepEqual(steps, ["persistir", "notificar"]);
  }
  assert.notEqual(
    new ComunicadoGeral().titulo(),
    new ComunicadoUrgente().titulo(),
  );
  assert.notEqual(
    new ChamadoManutencao().titulo(),
    new ChamadoOcorrencia().titulo(),
  );
  assert.notEqual(
    new EncomendaPacote().titulo(),
    new EncomendaDocumento().titulo(),
  );
});
test("servidor filtra campos desconhecidos e impede escalada de perfil", () => {
  const data = validateData("condominios", {
    nome: "Condomínio Teste",
    endereco: "Rua Teste 100",
    telefone: "41999990000",
    limite_reservas: 3,
    perfil: "sindico",
  });
  assert.equal(data.perfil, undefined);
  assert.throws(
    () => allow({ perfil: "morador" }, "comunicados", "create"),
    /permissão/,
  );
  assert.equal(
    constrainData({ perfil: "morador", morador_id: 7 }, "visitantes", {
      morador_id: 999,
    }).morador_id,
    7,
  );
});
test("validação rejeita capacidade negativa e e-mail inválido", () => {
  assert.throws(
    () =>
      validateData("areas", {
        condominio_id: 1,
        nome: "Piscina",
        capacidade: -1,
        taxa: 0,
        status: "disponivel",
      }),
    /limite/,
  );
  assert.throws(
    () =>
      validateData("moradores", {
        unidade_id: 1,
        nome: "Ana Silva",
        email: "sem-arroba",
        telefone: "41999990000",
      }),
    /E-mail/,
  );
});
