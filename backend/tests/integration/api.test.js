// Execute somente em um banco terminado em _test. O README explica como preparar.
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { app } from "../../server.js";
import { pool } from "../../db.js";
let server, base;
const cookies = {};
async function request(role, url, method = "GET", body) {
  const response = await fetch(base + "/api" + url, {
    method,
    headers: {
      ...(cookies[role] ? { Cookie: cookies[role] } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = response.headers.get("content-type")?.includes("json")
    ? await response.json()
    : await response.arrayBuffer();
  return { status: response.status, data, headers: response.headers };
}
function at(days, hour) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return new Date(d - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
}
before(async () => {
  assert.match(
    process.env.DB_NAME || "",
    /_test$/,
    "Defina DB_NAME=condoflow_test para não alterar seu banco normal.",
  );
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = "http://127.0.0.1:" + server.address().port;
  for (const role of ["sindico", "morador", "porteiro", "prestador"]) {
    const result = await request(null, "/login", "POST", {
      email: role + "@condoflow.com",
      senha: "Condo@123",
      perfil: role,
    });
    assert.equal(result.status, 200, JSON.stringify(result.data));
    cookies[role] = result.headers.get("set-cookie").split(";")[0];
  }
});
after(async () => {
  await new Promise((resolve) => server?.close(resolve));
  await pool.end();
});

test("exige login e verifica o perfil escolhido", async () => {
  assert.equal((await request(null, "/chamados")).status, 401);
  assert.equal(
    (
      await request(null, "/login", "POST", {
        email: "morador@condoflow.com",
        senha: "Condo@123",
        perfil: "sindico",
      })
    ).status,
    401,
  );
  assert.equal(
    (await request("morador", "/comunicados", "POST", {})).status,
    403,
  );
  assert.equal((await request("porteiro", "/prestadores")).status, 403);
});
test("as dez telas têm CRUD persistido no MySQL", async () => {
  const ids = {};
  const unique = Date.now();
  const fixtures = [
    [
      "condominios",
      () => ({
        nome: "Condomínio CRUD " + unique,
        endereco: "Rua dos testes, 10",
        telefone: "41999990000",
        limite_reservas: 3,
      }),
    ],
    [
      "unidades",
      () => ({
        condominio_id: ids.condominios,
        bloco: "Teste",
        numero: "101",
        andar: 1,
      }),
    ],
    [
      "moradores",
      () => ({
        unidade_id: ids.unidades,
        nome: "Morador CRUD",
        email: `morador${unique}@teste.com`,
        telefone: "41999990001",
        senha: "Teste@123",
      }),
    ],
    [
      "prestadores",
      () => ({
        nome: "Prestador CRUD",
        especialidade: "Elétrica",
        email: `prestador${unique}@teste.com`,
        telefone: "41999990002",
        documento: "DEMO-55555",
        contrato: "Contrato de teste",
        senha: "Teste@123",
      }),
    ],
    [
      "areas",
      () => ({
        condominio_id: ids.condominios,
        nome: "Salão CRUD",
        capacidade: 25,
        taxa: 50,
        status: "disponivel",
      }),
    ],
    [
      "comunicados",
      () => ({
        condominio_id: ids.condominios,
        titulo: "Comunicado CRUD",
        mensagem: "Mensagem de demonstração de CRUD completo.",
        tipo: "urgente",
        bloco: "Teste editado",
      }),
    ],
    [
      "visitantes",
      () => ({
        morador_id: ids.moradores,
        nome: "Visitante CRUD",
        documento: "DEMO-66666",
        inicio: at(3, 10),
        fim: at(3, 12),
      }),
    ],
    [
      "encomendas",
      () => ({
        morador_id: ids.moradores,
        descricao: "Caixa de testes",
        transportadora: "Entregas Teste",
        tipo: "pacote",
      }),
    ],
    [
      "reservas",
      () => ({
        area_id: ids.areas,
        morador_id: ids.moradores,
        inicio: at(5, 10),
        fim: at(5, 12),
        convidados: 5,
        status: "confirmada",
      }),
    ],
    [
      "chamados",
      () => ({
        morador_id: ids.moradores,
        titulo: "Chamado de testes",
        categoria: "manutencao",
        local: "Apartamento 101",
        descricao: "Descrição completa do problema de teste.",
        prioridade: "media",
        prestador_id: null,
        status: "aberto",
        relato: null,
      }),
    ],
  ];
  for (const [resource, fixture] of fixtures) {
    const body = fixture(),
      created = await request("sindico", "/" + resource, "POST", body);
    assert.equal(
      created.status,
      201,
      resource + ": " + JSON.stringify(created.data),
    );
    ids[resource] = created.data.id;
    const read = await request("sindico", `/${resource}/${created.data.id}`);
    assert.equal(read.status, 200);
    const field =
      ["nome", "titulo", "descricao", "bloco"].find((key) =>
        Object.hasOwn(body, key),
      ) || "convidados";
    const changed = {
      ...body,
      [field]: field === "convidados" ? 6 : body[field] + " editado",
    };
    // Uma unidade renomeada exige que o comunicado use o bloco atualizado.
    if (resource === "comunicados") changed.bloco = "Teste editado";
    const updated = await request(
      "sindico",
      `/${resource}/${created.data.id}`,
      "PUT",
      changed,
    );
    assert.equal(
      updated.status,
      200,
      resource + ": " + JSON.stringify(updated.data),
    );
    const [[row]] = await pool.execute(`SELECT * FROM ${resource} WHERE id=?`, [
      created.data.id,
    ]);
    assert.equal(row[field], changed[field]);
  }
  // A criação de comunicado segmentado usa o bloco atualizado da unidade.
  const blocked = await request(
    "sindico",
    `/condominios/${ids.condominios}`,
    "DELETE",
  );
  assert.equal(blocked.status, 409);
  for (const [resource] of [...fixtures].reverse()) {
    assert.equal(
      (await request("sindico", `/${resource}/${ids[resource]}`, "DELETE"))
        .status,
      200,
      resource,
    );
    assert.equal(
      (await request("sindico", `/${resource}/${ids[resource]}`)).status,
      404,
    );
  }
});
test("morador não consulta registros de outro morador; prestador só vê atribuídos", async () => {
  const m = await request("morador", "/chamados");
  assert.ok(m.data.every((row) => row.morador_id === 1));
  assert.equal((await request("morador", "/chamados/3")).status, 404);
  const p = await request("prestador", "/chamados");
  assert.ok(p.data.every((row) => row.prestador_id === 1));
  assert.equal((await request("prestador", "/chamados/2")).status, 404);
});
test("duas reservas simultâneas no mesmo horário resultam em uma confirmação", async () => {
  const body = {
    area_id: 2,
    morador_id: 1,
    inicio: at(10, 10),
    fim: at(10, 12),
    convidados: 5,
    status: "confirmada",
  };
  const results = await Promise.all([
    request("morador", "/reservas", "POST", body),
    request("morador", "/reservas", "POST", body),
  ]);
  assert.deepEqual(results.map((x) => x.status).sort(), [201, 409]);
  const success = results.find((x) => x.status === 201);
  await request("sindico", "/reservas/" + success.data.id, "DELETE");
});
test("reserva rejeita área em manutenção, excesso de capacidade e condomínio diferente", async () => {
  const body = {
    area_id: 3,
    morador_id: 1,
    inicio: at(11, 10),
    fim: at(11, 12),
    convidados: 1,
    status: "confirmada",
  };
  assert.equal(
    (await request("morador", "/reservas", "POST", body)).status,
    400,
  );
  assert.equal(
    (
      await request("morador", "/reservas", "POST", {
        ...body,
        area_id: 2,
        convidados: 999,
      })
    ).status,
    400,
  );
  const condo = await request("sindico", "/condominios", "POST", {
    nome: "Condomínio isolado",
    endereco: "Rua Exemplo",
    telefone: "41999999999",
    limite_reservas: 3,
  });
  const area = await request("sindico", "/areas", "POST", {
    condominio_id: condo.data.id,
    nome: "Área isolada",
    capacidade: 10,
    taxa: 0,
    status: "disponivel",
  });
  assert.equal(
    (
      await request("morador", "/reservas", "POST", {
        ...body,
        area_id: area.data.id,
      })
    ).status,
    400,
  );
  await request("sindico", "/areas/" + area.data.id, "DELETE");
  await request("sindico", "/condominios/" + condo.data.id, "DELETE");
});
test("visitante: QR, validade, entrada única e saída", async () => {
  const start = new Date(Date.now() - 60000),
    end = new Date(Date.now() + 3600000);
  const local = (d) =>
    new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
  const created = await request("morador", "/visitantes", "POST", {
    morador_id: 2,
    nome: "Visitante de teste",
    documento: "DEMO-7777",
    inicio: local(start),
    fim: local(end),
  });
  assert.equal(created.status, 201, JSON.stringify(created.data));
  const id = created.data.id;
  const detail = await request("morador", `/visitantes/${id}`);
  assert.equal(detail.data.row.morador_id, 1);
  const qr = await request("morador", `/visitantes/${id}/qr`);
  assert.equal(qr.status, 200);
  assert.ok(qr.data.byteLength > 100);
  assert.equal(
    (
      await request("porteiro", `/visitantes/${id}/entrada`, "POST", {
        codigo: "errado",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("porteiro", `/visitantes/${id}/entrada`, "POST", {
        codigo: detail.data.row.codigo,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request("porteiro", `/visitantes/${id}/entrada`, "POST", {
        codigo: detail.data.row.codigo,
      })
    ).status,
    400,
  );
  assert.equal(
    (await request("porteiro", `/visitantes/${id}/saida`, "POST", {})).status,
    200,
  );
  await request("sindico", `/visitantes/${id}`, "DELETE");
});
test("encomenda notifica destinatário e registra pessoa/data da retirada", async () => {
  const created = await request("porteiro", "/encomendas", "POST", {
    morador_id: 1,
    descricao: "Documento de teste",
    transportadora: "Correios",
    tipo: "documento",
  });
  assert.equal(created.status, 201);
  const id = created.data.id;
  const notices = await request("morador", "/notificacoes");
  assert.ok(notices.data.some((x) => x.titulo === "Documento recebido"));
  assert.equal(
    (
      await request("morador", `/encomendas/${id}/retirar`, "POST", {
        responsavel: "Lucas",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("porteiro", `/encomendas/${id}/retirar`, "POST", {
        responsavel: "Lucas Almeida",
      })
    ).status,
    200,
  );
  const detail = await request("morador", `/encomendas/${id}`);
  assert.equal(detail.data.row.retirado_por, "Lucas Almeida");
  assert.ok(detail.data.row.retirada_em);
  await request("sindico", `/encomendas/${id}`, "DELETE");
});
test("prestador envia evidência; somente síndico aprova e a decisão fica no histórico", async () => {
  const body = {
    morador_id: 1,
    titulo: "Manutenção de teste",
    categoria: "manutencao",
    local: "Cozinha",
    descricao: "Descrição para testar o fluxo de manutenção.",
    prioridade: "media",
    prestador_id: 1,
    status: "aberto",
    relato: null,
  };
  const created = await request("sindico", "/chamados", "POST", body);
  assert.equal(created.status, 201);
  const id = created.data.id;
  assert.equal(
    (
      await request("prestador", `/chamados/${id}`, "PUT", {
        status: "resolvido",
        relato: "Resolvido",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("prestador", `/chamados/${id}`, "PUT", {
        status: "aguardando_aprovacao",
        relato: "Troquei a conexão e testei o vazamento.",
      })
    ).status,
    400,
  );
  const photo = {
    nome: "evidencia.png",
    base64:
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2uoAAAAASUVORK5CYII=",
  };
  const updated = await request("prestador", `/chamados/${id}`, "PUT", {
    status: "aguardando_aprovacao",
    relato: "Troquei a conexão e testei o vazamento.",
    anexo: photo,
  });
  assert.equal(updated.status, 200, JSON.stringify(updated.data));
  assert.equal(
    (
      await request("morador", `/chamados/${id}/aprovar`, "POST", {
        justificativa: "Serviço aprovado.",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("sindico", `/chamados/${id}/aprovar`, "POST", {
        justificativa: "Serviço conferido e aprovado.",
      })
    ).status,
    200,
  );
  const detail = await request("morador", `/chamados/${id}`);
  assert.equal(detail.data.row.status, "resolvido");
  assert.ok(detail.data.history.some((h) => h.acao === "aprovar"));
  assert.equal(
    (await request("morador", "/anexos/" + detail.data.attachments[0].id))
      .status,
    200,
  );
  await request("sindico", `/chamados/${id}`, "DELETE");
});
