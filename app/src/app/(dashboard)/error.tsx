"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Erro ao carregar o dashboard", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="glass-card max-w-lg w-full p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-red-600">Falha ao carregar dados</p>
        <h1 className="text-2xl font-bold mt-2">O banco não respondeu</h1>
        <p className="text-sm text-slate-600 mt-3">A sessão está ativa, mas esta página não conseguiu consultar o banco. Tente novamente ou saia para abrir a tela de senha.</p>
        <div className="flex justify-center gap-2 mt-5">
          <button type="button" onClick={() => reset()} className="ios-btn ios-btn-primary">Tentar novamente</button>
          <Link href="/login" className="ios-btn ios-btn-secondary">Voltar ao login</Link>
        </div>
      </div>
    </div>
  );
}
