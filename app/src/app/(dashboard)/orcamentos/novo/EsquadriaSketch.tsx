"use client";

// Desenho estilo rascunho/esquadria técnica: atualiza conforme categoria, nº de folhas e medidas digitadas
export default function EsquadriaSketch({
  categoria,
  numFolhas,
  larguraCm,
  alturaCm,
}: {
  categoria: string;
  numFolhas: number;
  larguraCm: number;
  alturaCm: number;
}) {
  const isPorta = categoria.startsWith("PORTA");
  const isCorrer = categoria.includes("CORRER");
  const isGiro = categoria === "PORTA_GIRO";
  const isFixo = categoria === "FIXO";
  const isCobertura = categoria === "COBERTURA_PERGOLADO";

  const W = 320;
  const H = 230;
  const pad = 52;
  const x0 = pad;
  const y0 = 16;
  const x1 = W - 16;
  const y1 = H - pad;
  const larguraDesenho = x1 - x0;
  const alturaDesenho = y1 - y0;

  const folhas = Math.max(numFolhas, 1);
  const linhas = Array.from({ length: folhas - 1 }, (_, i) => x0 + ((i + 1) * larguraDesenho) / folhas);

  return (
    <div className="glass-card p-4 flex flex-col items-center gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-sm font-[family-name:var(--font-sketch)]" style={{ color: "#334155" }}>
        <defs>
          <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.35" opacity="0.18" /></pattern>
          <marker id="arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M 0 0 L 7 3.5 L 0 7 z" fill="currentColor" /></marker>
        </defs>
        <rect x={x0} y={y0} width={larguraDesenho} height={alturaDesenho} fill="url(#grid)" stroke="currentColor" strokeWidth={2.5} rx={isPorta ? 2 : 5} />
        <rect x={x0 + 7} y={y0 + 7} width={larguraDesenho - 14} height={alturaDesenho - 14} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.65} rx={isPorta ? 1 : 3} />
        {!isCobertura && <><line x1={x0 + 3} y1={y0 + 16} x2={x1 - 3} y2={y0 + 16} stroke="currentColor" strokeWidth={2} opacity={0.5} /><line x1={x0 + 3} y1={y1 - 16} x2={x1 - 3} y2={y1 - 16} stroke="currentColor" strokeWidth={2} opacity={0.5} /></>}

        {/* Divisão das folhas */}
        {linhas.map((lx, i) => (
          <g key={i}><line x1={lx} y1={y0 + 8} x2={lx} y2={y1 - 8} stroke="currentColor" strokeWidth={2} /><line x1={lx - 4} y1={y0 + 10} x2={lx - 4} y2={y1 - 10} stroke="currentColor" strokeWidth={0.8} opacity={0.55} /></g>
        ))}

        {/* Setas de correr ou arco de giro, indicando o tipo de abertura */}
        {isCorrer &&
          linhas.length === 0 &&
          folhas > 1 && null}
        {isCorrer && (
          <g opacity={0.8}>
            <path d={`M ${x0 + larguraDesenho * 0.3} ${y0 + alturaDesenho / 2} h -18`} stroke="currentColor" fill="none" strokeWidth={1.5} markerEnd="url(#arrow)" />
            <path d={`M ${x0 + larguraDesenho * 0.7} ${y0 + alturaDesenho / 2} h 18`} stroke="currentColor" fill="none" strokeWidth={1.5} markerEnd="url(#arrow)" />
          </g>
        )}
        {isGiro && (
          <g opacity={0.8}>
            <path d={`M ${x0 + 6} ${y0 + 6} L ${x0 + 6} ${y1 - 6} A ${alturaDesenho - 12} ${alturaDesenho - 12} 0 0 0 ${x0 + 6 + (alturaDesenho - 12)} ${y0 + 6}`} stroke="currentColor" fill="none" strokeDasharray="3 3" strokeWidth={1.2} />
          </g>
        )}
        {categoria === "VITRO_BASCULANTE" && (
          <path d={`M ${x0 + 6} ${y1 - 6} L ${(x0 + x1) / 2} ${y0 + 8} L ${x1 - 6} ${y1 - 6}`} stroke="currentColor" fill="none" strokeDasharray="3 3" strokeWidth={1.2} opacity={0.8} />
        )}
        {isCobertura && (
          <g opacity="0.9">
            {linhas.map((lx, i) => <g key={`t-${i}`}><line x1={lx} y1={y0 + 8} x2={lx} y2={y1 - 8} stroke="#b45309" strokeWidth={3} /><text x={lx + 4} y={y0 + 28} fontSize={9} fill="#92400e">T</text></g>)}
            <text x={(x0 + x1) / 2} y={(y0 + y1) / 2} textAnchor="middle" fontSize={12} fill="currentColor">VIDRO SOBRE PERGOLADO</text>
          </g>
        )}
        {isFixo && <text x={(x0 + x1) / 2} y={(y0 + y1) / 2} textAnchor="middle" fontSize={13} fill="currentColor" opacity={0.55}>FIXO</text>}

        {/* Cota de largura (topo) */}
        <line x1={x0} y1={y0 - 8} x2={x1} y2={y0 - 8} stroke="currentColor" strokeWidth={1} markerStart="url(#arrow)" markerEnd="url(#arrow)" />
        <line x1={x0} y1={y0 - 12} x2={x0} y2={y0 - 4} stroke="currentColor" strokeWidth={1} />
        <line x1={x1} y1={y0 - 12} x2={x1} y2={y0 - 4} stroke="currentColor" strokeWidth={1} />
        <text x={(x0 + x1) / 2} y={y0 - 14} textAnchor="middle" fontSize={14} fill="currentColor">
          {larguraCm || 0} cm
        </text>

        {/* Cota de altura (esquerda) */}
        <line x1={x0 - 8} y1={y0} x2={x0 - 8} y2={y1} stroke="currentColor" strokeWidth={1} markerStart="url(#arrow)" markerEnd="url(#arrow)" />
        <line x1={x0 - 12} y1={y0} x2={x0 - 4} y2={y0} stroke="currentColor" strokeWidth={1} />
        <line x1={x0 - 12} y1={y1} x2={x0 - 4} y2={y1} stroke="currentColor" strokeWidth={1} />
        <text x={x0 - 16} y={(y0 + y1) / 2} textAnchor="middle" fontSize={14} fill="currentColor" transform={`rotate(-90 ${x0 - 16} ${(y0 + y1) / 2})`}>
          {alturaCm || 0} cm
        </text>
      </svg>
      <p className="text-xs text-slate-500 -mt-1">
        {isCobertura ? "Vista superior técnica · placas de vidro + emendas T" : `Vista frontal técnica · ${folhas} folha${folhas > 1 ? "s" : ""} · ${isPorta ? "porta" : "janela"}`} · cotas em cm
      </p>
    </div>
  );
}
