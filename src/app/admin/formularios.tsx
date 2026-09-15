"use client";

import { useActionState } from "react";
import type { Produto, StatusProduto, TipoProduto } from "@/db/admin";
import {
  entrarAdmin,
  lancarCobranca,
  salvarCliente,
  salvarProduto,
  sairDoAdmin,
  type Estado,
} from "./acoes";

/* --- pecas ---------------------------------------------------------- */

const campo =
  "min-h-11 w-full rounded-btn border border-line px-3 text-base outline-none focus:border-acc";
const rotulo = "text-sm font-medium text-ink";
const botao =
  "min-h-11 rounded-btn bg-acc px-5 text-base font-medium text-white hover:bg-acc-hover disabled:opacity-60";

function Campo({
  nome,
  texto,
  tipo = "text",
  valor,
  obrigatorio,
  dica,
}: {
  nome: string;
  texto: string;
  tipo?: string;
  valor?: string | number | null;
  obrigatorio?: boolean;
  dica?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={rotulo}>
        {texto}
        {obrigatorio && <span className="text-danger"> *</span>}
      </span>
      <input
        name={nome}
        type={tipo}
        defaultValue={valor ?? ""}
        required={obrigatorio}
        className={campo}
      />
      {dica && <span className="text-xs text-n2">{dica}</span>}
    </label>
  );
}

function Escolha({
  nome,
  texto,
  valor,
  opcoes,
}: {
  nome: string;
  texto: string;
  valor?: string;
  opcoes: { v: string; t: string }[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={rotulo}>{texto}</span>
      <select name={nome} defaultValue={valor} className={campo}>
        {opcoes.map((o) => (
          <option key={o.v} value={o.v}>
            {o.t}
          </option>
        ))}
      </select>
    </label>
  );
}

function Erro({ estado }: { estado: Estado }) {
  if (estado.erro) {
    return (
      <p role="alert" className="rounded-btn bg-danger-wash px-3 py-2 text-sm text-danger">
        {estado.erro}
      </p>
    );
  }
  // Aviso: o registro FOI salvo, mas a sincronizacao com o Asaas nao foi.
  if (estado.aviso) {
    return (
      <p role="alert" className="rounded-btn bg-wash px-3 py-2 text-sm text-ink">
        {estado.aviso}
      </p>
    );
  }
  if (estado.ok) {
    return (
      <p className="rounded-btn bg-acc-soft px-3 py-2 text-sm text-acc">
        Salvo e sincronizado com o Asaas.
      </p>
    );
  }
  return null;
}

/* --- login ---------------------------------------------------------- */

export function FormLogin() {
  const [estado, acao, enviando] = useActionState<Estado, FormData>(entrarAdmin, {});
  return (
    <form action={acao} className="flex flex-col gap-4">
      <Erro estado={estado} />
      <Campo nome="email" texto="E-mail" tipo="email" obrigatorio />
      <Campo nome="senha" texto="Senha" tipo="password" obrigatorio />
      <button className={botao} disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

export function BotaoSairAdmin() {
  return (
    <form action={sairDoAdmin}>
      <button className="text-sm text-n1 hover:text-ink">Sair</button>
    </form>
  );
}

/* --- cliente -------------------------------------------------------- */

export function FormCliente({
  cliente,
}: {
  cliente?: {
    id: string;
    nome: string;
    email: string;
    documento: string;
    telefone: string | null;
  };
}) {
  const [estado, acao, enviando] = useActionState<Estado, FormData>(salvarCliente, {});
  return (
    <form action={acao} className="flex flex-col gap-4">
      <Erro estado={estado} />
      {cliente && <input type="hidden" name="id" value={cliente.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo nome="nome" texto="Nome" valor={cliente?.nome} obrigatorio />
        <Campo nome="email" texto="E-mail" tipo="email" valor={cliente?.email} obrigatorio />
        <Campo
          nome="documento"
          texto="CPF ou CNPJ"
          valor={cliente?.documento}
          obrigatorio
          dica="O Asaas exige. Vai impresso no recibo."
        />
        <Campo nome="telefone" texto="Telefone" valor={cliente?.telefone} />
      </div>
      <button className={`${botao} self-start`} disabled={enviando}>
        {enviando ? "Salvando…" : cliente ? "Salvar alterações" : "Cadastrar cliente"}
      </button>
    </form>
  );
}

/* --- produto -------------------------------------------------------- */

const TIPOS: { v: TipoProduto; t: string }[] = [
  { v: "site", t: "Site" },
  { v: "sistema", t: "Sistema" },
  { v: "manutencao", t: "Manutenção" },
];

const STATUS: { v: StatusProduto; t: string }[] = [
  { v: "ativo", t: "Ativo" },
  { v: "pausado", t: "Pausado" },
  { v: "encerrado", t: "Encerrado" },
];

export function FormProduto({
  clienteId,
  produto,
}: {
  clienteId: string;
  produto?: Produto;
}) {
  const [estado, acao, enviando] = useActionState<Estado, FormData>(salvarProduto, {});
  return (
    <form action={acao} className="flex flex-col gap-4">
      <Erro estado={estado} />
      <input type="hidden" name="clienteId" value={clienteId} />
      {produto && <input type="hidden" name="id" value={produto.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo nome="nome" texto="Nome" valor={produto?.nome} obrigatorio />
        <Escolha nome="tipo" texto="Tipo" valor={produto?.tipo ?? "site"} opcoes={TIPOS} />
        <Campo nome="descricao" texto="Descrição" valor={produto?.descricao} />
        <Campo nome="endereco" texto="Endereço" valor={produto?.endereco} dica="dominio.com.br" />
        <Campo
          nome="mensalidade"
          texto="Mensalidade"
          valor={
            produto?.mensalidadeCentavos != null
              ? (produto.mensalidadeCentavos / 100).toFixed(2).replace(".", ",")
              : ""
          }
          dica="Em reais, ex.: 250,00. Vazio = sem mensalidade"
        />
        <Campo
          nome="diaVencimento"
          texto="Dia do vencimento"
          tipo="number"
          valor={produto?.diaVencimento}
          dica="De 1 a 28"
        />
        <Escolha nome="status" texto="Status" valor={produto?.status ?? "ativo"} opcoes={STATUS} />
        <Campo
          nome="ativoDesde"
          texto="Início do contrato"
          tipo="date"
          valor={produto?.ativoDesde?.slice(0, 10)}
        />
      </div>
      <button className={`${botao} self-start`} disabled={enviando}>
        {enviando ? "Salvando…" : produto ? "Salvar produto" : "Adicionar produto"}
      </button>
    </form>
  );
}

/* --- cobranca avulsa ------------------------------------------------ */

export function FormCobranca({
  clienteId,
  produtos,
}: {
  clienteId: string;
  produtos: { id: string; nome: string }[];
}) {
  const [estado, acao, enviando] = useActionState<Estado, FormData>(lancarCobranca, {});

  if (produtos.length === 0) {
    return (
      <p className="text-sm text-n1">
        Cadastre um produto antes: cobrança avulsa é sempre ligada a um.
      </p>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-4">
      <Erro estado={estado} />
      <input type="hidden" name="clienteId" value={clienteId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Escolha
          nome="produtoId"
          texto="Produto"
          opcoes={produtos.map((p) => ({ v: p.id, t: p.nome }))}
        />
        <Campo
          nome="descricao"
          texto="Descrição"
          obrigatorio
          dica="Ex.: feature nova no site"
        />
        <Campo nome="valor" texto="Valor" obrigatorio dica="Em reais, ex.: 40,00" />
        <Campo nome="vencimento" texto="Vencimento" tipo="date" obrigatorio />
      </div>
      <button className={`${botao} self-start`} disabled={enviando}>
        {enviando ? "Lançando…" : "Lançar cobrança"}
      </button>
    </form>
  );
}
