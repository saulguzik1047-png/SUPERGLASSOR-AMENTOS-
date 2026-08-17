import { login } from "@/lib/auth-actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; next?: string }>;
}) {
  const { erro, next } = await searchParams;

  return (
    <div className="h-dvh flex flex-col items-center justify-center gap-6 px-6">
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 text-4xl font-black tracking-tight">
          <span className="text-slate-900">SUL</span>
          <span className="bg-gradient-to-br from-blue-500 to-sky-300 bg-clip-text text-transparent">GLASS</span>
        </div>
        <p className="text-slate-500 text-sm font-medium">Orçamentos de esquadrias</p>
      </div>

      <form action={login} className="glass-card w-full max-w-md p-6 flex flex-col gap-4">
        <input type="hidden" name="next" value={next || "/"} />
        <label className="flex flex-col gap-2 text-base font-semibold text-slate-700">
          Senha de acesso
          <input
            type="password"
            name="senha"
            autoFocus
            required
            className="ios-input text-center text-2xl tracking-widest min-h-16"
            placeholder="••••••••"
          />
        </label>
        {erro && <p className="text-red-600 text-sm text-center">Senha incorreta. Tente novamente.</p>}
        <button className="ios-btn ios-btn-primary justify-center mt-1 w-full min-h-16 !py-4 !text-xl whitespace-nowrap">Entrar</button>
      </form>
    </div>
  );
}
