"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { atualizarStatusOrcamento, excluirOrcamento } from "@/lib/actions";

interface ItemPdf {
  descricao: string;
  largura: number;
  altura: number;
  quantidade: number;
  corPerfil: string;
  tipoVidro: string;
  valorItem: number;
}

export default function OrcamentoAcoes({
  orcamentoId,
  numero,
  status,
  clienteNome,
  clienteTelefone,
  clienteEndereco,
  maoDeObra,
  descontoValor,
  descontoMotivo,
  observacoes,
  subtotal,
  total,
  criadoEm,
  itens,
}: {
  orcamentoId: number;
  numero: number;
  status: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteEndereco: string | null;
  maoDeObra: number;
  descontoValor: number;
  descontoMotivo: string | null;
  observacoes: string | null;
  subtotal: number;
  total: number;
  criadoEm: string;
  itens: ItemPdf[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusAtual, setStatusAtual] = useState(status);

  function gerarPdf() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Orçamento #${numero}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Data: ${criadoEm}`, 14, 25);
    doc.text(`Cliente: ${clienteNome}`, 14, 31);
    doc.text(`Telefone: ${clienteTelefone}`, 14, 36);
    if (clienteEndereco) doc.text(`Endereço: ${clienteEndereco}`, 14, 41);

    autoTable(doc, {
      startY: 48,
      head: [["Item", "Medidas (cm)", "Qtd", "Cor", "Vidro", "Valor (R$)"]],
      body: itens.map((i) => [
        i.descricao,
        `${i.largura}x${i.altura}`,
        String(i.quantidade),
        i.corPerfil,
        i.tipoVidro,
        i.valorItem.toFixed(2),
      ]),
    });

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.text(`Mão de obra: R$ ${maoDeObra.toFixed(2)}`, 14, finalY);
    doc.text(`Subtotal: R$ ${subtotal.toFixed(2)}`, 14, finalY + 5);
    if (descontoValor > 0) {
      doc.text(`Desconto: R$ ${descontoValor.toFixed(2)}${descontoMotivo ? ` (${descontoMotivo})` : ""}`, 14, finalY + 10);
    }
    doc.setFontSize(13);
    doc.text(`Total: R$ ${total.toFixed(2)}`, 14, finalY + (descontoValor > 0 ? 18 : 12));
    if (observacoes) {
      doc.setFontSize(10);
      doc.text(`Obs: ${observacoes}`, 14, finalY + (descontoValor > 0 ? 26 : 20));
    }

    doc.save(`orcamento-${numero}.pdf`);
  }

  function abrirWhatsapp() {
    const numeroLimpo = clienteTelefone.replace(/\D/g, "");
    const mensagem = encodeURIComponent(
      `Olá ${clienteNome}! Segue o orçamento #${numero} no valor de R$ ${total.toFixed(2)}. Vou anexar o PDF com todos os detalhes aqui na conversa.`
    );
    const url = numeroLimpo ? `https://wa.me/${numeroLimpo}?text=${mensagem}` : `https://wa.me/?text=${mensagem}`;
    window.open(url, "_blank");
  }

  function mudarStatus(novo: "RASCUNHO" | "ENVIADO" | "APROVADO" | "RECUSADO") {
    startTransition(async () => {
      await atualizarStatusOrcamento(orcamentoId, novo);
      setStatusAtual(novo);
    });
  }

  function excluir() {
    if (!confirm("Excluir este orçamento em rascunho? Essa ação não pode ser desfeita.")) return;
    startTransition(async () => {
      await excluirOrcamento(orcamentoId);
      router.push("/orcamentos");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button onClick={gerarPdf} className="bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-4 py-2 font-semibold text-sm">
          📄 Gerar PDF
        </button>
        <button onClick={abrirWhatsapp} className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 font-semibold text-sm">
          💬 Enviar pelo WhatsApp
        </button>
      </div>
      <p className="text-xs text-slate-500">Gere o PDF primeiro e anexe-o na conversa do WhatsApp que será aberta.</p>

      <div className="flex flex-wrap gap-2 items-center pt-2 border-t mt-2">
        <span className="text-sm text-slate-500">Status:</span>
        {(["RASCUNHO", "ENVIADO", "APROVADO", "RECUSADO"] as const).map((s) => (
          <button
            key={s}
            disabled={isPending}
            onClick={() => mudarStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium ${statusAtual === s ? "bg-blue-600 text-white" : "bg-slate-100 hover:bg-slate-200"}`}
          >
            {s}
          </button>
        ))}
        {statusAtual === "RASCUNHO" && (
          <button onClick={excluir} disabled={isPending} className="ml-auto text-red-600 text-xs hover:underline">
            Excluir orçamento
          </button>
        )}
      </div>
    </div>
  );
}
