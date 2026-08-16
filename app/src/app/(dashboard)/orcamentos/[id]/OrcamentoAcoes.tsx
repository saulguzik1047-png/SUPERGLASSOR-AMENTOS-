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
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  function construirPdf() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Orçamento #${numero} — SULGLASS`, 14, 18);
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

    return doc;
  }

  function mensagemFormal() {
    const primeiroNome = clienteNome.split(" ")[0];
    return (
      `Olá, ${primeiroNome}! 😊\n\n` +
      `Agradecemos muito por confiar na *SULGLASS* para o seu projeto! Segue em anexo o orçamento nº ${numero}, ` +
      `no valor total de R$ ${total.toFixed(2)}.\n\n` +
      `Ficamos à disposição para tirar qualquer dúvida ou ajustar algum detalhe. Assim que estiver aprovado, ` +
      `é só nos avisar por aqui que já damos sequência à produção. 🙏\n\n` +
      `Um abraço,\nEquipe SULGLASS`
    );
  }

  function gerarPdf() {
    construirPdf().save(`orcamento-${numero}-sulglass.pdf`);
  }

  async function enviarComPdfAnexado() {
    setAviso(null);
    setEnviando(true);
    try {
      const doc = construirPdf();
      const blob = doc.output("blob");
      const arquivo = new File([blob], `orcamento-${numero}-sulglass.pdf`, { type: "application/pdf" });
      const mensagem = mensagemFormal();

      const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
      if (nav.share && nav.canShare && nav.canShare({ files: [arquivo] })) {
        await nav.share({ files: [arquivo], title: `Orçamento #${numero} — SULGLASS`, text: mensagem });
        return;
      }

      // Sem suporte a compartilhar arquivos (ex: computador): baixa o PDF e abre o WhatsApp com a mensagem pronta
      doc.save(`orcamento-${numero}-sulglass.pdf`);
      const numeroLimpo = clienteTelefone.replace(/\D/g, "");
      const url = numeroLimpo
        ? `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagem)}`
        : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
      window.open(url, "_blank");
      setAviso("Seu navegador não anexa o PDF automaticamente. O arquivo foi baixado — anexe-o na conversa do WhatsApp que abriu.");
    } catch {
      // usuário cancelou o compartilhamento — não faz nada
    } finally {
      setEnviando(false);
    }
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
        <button onClick={enviarComPdfAnexado} disabled={enviando} className="ios-btn ios-btn-success">
          {enviando ? "Preparando..." : "💬📎 Enviar PDF pelo WhatsApp"}
        </button>
        <button onClick={gerarPdf} className="ios-btn ios-btn-dark">
          📄 Baixar PDF
        </button>
      </div>
      {aviso && <p className="text-xs text-amber-700">{aviso}</p>}
      <p className="text-xs text-slate-500">
        No celular, o PDF já sai anexado ao abrir o compartilhamento — só escolher o WhatsApp e o contato.
      </p>


      <div className="flex flex-wrap gap-2 items-center pt-2 border-t mt-2">
        <span className="text-sm text-slate-500">Status:</span>
        {(["RASCUNHO", "ENVIADO", "APROVADO", "RECUSADO"] as const).map((s) => (
          <button
            key={s}
            disabled={isPending}
            onClick={() => mudarStatus(s)}
            className={`ios-pill ${statusAtual === s ? "bg-blue-600 text-white" : "bg-white/60 hover:bg-white/90"}`}
          >
            {s}
          </button>
        ))}
        {statusAtual === "RASCUNHO" && (
          <button onClick={excluir} disabled={isPending} className="ml-auto ios-btn ios-btn-danger !py-1.5 !px-3 text-xs">
            Excluir orçamento
          </button>
        )}
      </div>
    </div>
  );
}
