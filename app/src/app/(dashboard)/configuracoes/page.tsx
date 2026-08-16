import { obterConfiguracaoEmpresa, atualizarConfiguracaoEmpresa } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const config = await obterConfiguracaoEmpresa();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Dados da empresa</h1>
      <p className="text-slate-600 text-sm">
        Essas informações aparecem no cabeçalho dos PDFs de orçamento enviados aos clientes.
      </p>

      <form action={atualizarConfiguracaoEmpresa} className="glass-card p-4 grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          Nome da empresa
          <input name="nome" defaultValue={config.nome} required className="ios-input" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          CNPJ
          <input name="cnpj" defaultValue={config.cnpj ?? ""} className="ios-input" placeholder="00.000.000/0001-00" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Telefone
          <input name="telefone" defaultValue={config.telefone ?? ""} className="ios-input" placeholder="(00) 00000-0000" />
        </label>
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          Endereço
          <input name="endereco" defaultValue={config.endereco ?? ""} className="ios-input" />
        </label>
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          Rodapé do PDF (condições gerais, garantia, etc.)
          <textarea
            name="rodape"
            defaultValue={config.rodape ?? ""}
            className="ios-input min-h-20"
            placeholder="Ex: Garantia de 12 meses contra defeitos de fabricação. Instalação inclusa."
          />
        </label>
        <button className="ios-btn ios-btn-primary w-fit md:col-span-2">Salvar</button>
      </form>
    </div>
  );
}
