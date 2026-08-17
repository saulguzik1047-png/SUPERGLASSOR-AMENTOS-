"use client";

import { useState } from "react";
import type { CortePerfil } from "@/lib/calculo";

export default function ListaCortesButton({ cortes }: { cortes: CortePerfil[] }) {
  const [aberto, setAberto] = useState(false);

  if (cortes.length === 0) {
    return <span className="text-xs text-slate-400">Sem lista salva</span>;
  }

  return (
    <>
      <button type="button" onClick={() => setAberto(true)} className="ios-btn ios-btn-success !px-2.5 !py-1 text-xs whitespace-nowrap">
        Lista de cortes
      </button>
      {aberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Lista de cortes">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-auto p-5 bg-white text-slate-900 border border-slate-300 rounded-xl shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold">Lista de cortes</h2>
                <p className="text-sm text-slate-600">Medidas prontas para marcar e cortar. Confira o sentido e a montagem antes do corte.</p>
              </div>
              <button type="button" onClick={() => setAberto(false)} className="ios-btn ios-btn-dark !px-3 !py-1.5">Fechar</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-300 text-slate-700 bg-slate-100">
                    <th className="py-2">Perfil</th>
                    <th>Peça</th>
                    <th>Qtd.</th>
                    <th>Comprimento</th>
                    <th>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {cortes.map((corte, index) => (
                    <tr key={`${corte.perfil}-${corte.descricao}-${index}`} className="border-b border-slate-200 last:border-0 align-top even:bg-slate-50">
                      <td className="py-2 font-medium">{corte.perfil}</td>
                      <td>{corte.descricao}</td>
                      <td>{corte.quantidade}</td>
                      <td className="font-bold whitespace-nowrap">{corte.comprimentoCm.toFixed(1)} cm</td>
                      <td className="text-xs text-slate-700">{corte.observacao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-amber-700">A lista já considera os descontos de encaixe e de emenda indicados no modelo.</p>
          </div>
        </div>
      )}
    </>
  );
}
