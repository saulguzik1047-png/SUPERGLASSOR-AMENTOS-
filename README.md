# SUPERGLASSOR-AMENTOS-

App de orçamentos para a **SULGLASS** (esquadrias de alumínio e vidro temperado). O código-fonte fica em [app/](app).

## O que o app faz

- **Login simples** com senha única (protege todo o app — veja como configurar abaixo).
- Cadastro de clientes (nome, endereço, telefone), com busca por nome/telefone/endereço.
- Novo orçamento: escolhe cliente, tipo de esquadria (janela/porta de correr, giro, fixo, basculante — 1, 2 ou mais folhas),
  informa largura/altura e a quantidade, com um esboço estilo rascunho de engenharia. O sistema calcula automaticamente:
  - metros/barras de perfil de alumínio necessários;
  - m² de vidro temperado;
  - rodízios, dobradiças, fechos, puxadores, cantoneiras, parafusos, silicone e fita de vedação.
- Campo de mão de obra, desconto (com motivo) e validade (dias) no próprio orçamento.
- **Editar** orçamentos em rascunho e **duplicar** qualquer orçamento para reaproveitar como base de um novo.
- Estoque de sobras: retalhos de perfil que sobram de cada corte são guardados automaticamente (com código de
  identificação, ex: `PF-0007`) e reaproveitados nos próximos orçamentos; quando isso acontece, o app avisa na
  tela para você poder oferecer desconto ao cliente.
- Orçamentos ficam arquivados (lista com busca por cliente e filtro por status: rascunho, enviado, aprovado, recusado).
- Botão para enviar o PDF do orçamento já anexado pelo WhatsApp (no celular, via compartilhamento nativo) com uma
  mensagem formal de agradecimento, ou baixar o PDF manualmente.
- Tela de **Configurações da empresa** (nome, CNPJ, endereço, telefone, rodapé) usada no cabeçalho do PDF.
- Tela de **Relatórios** com totais, taxa de conversão, vendas do mês e ticket médio.
- Instalável na tela inicial do celular (PWA) com o ícone da SULGLASS.

## Como rodar

```bash
cd app
cp .env.example .env        # depois edite APP_PASSWORD e gere um SESSION_SECRET próprio
npm install
npx prisma migrate deploy   # cria o banco (SQLite) com as tabelas
npm run seed                # cria os materiais e tipos de esquadria padrão
npm run dev                 # http://localhost:3000
```

A senha de acesso ao app fica em `APP_PASSWORD` no arquivo `app/.env`. Troque para uma senha só sua antes de usar
de verdade. O `SESSION_SECRET` pode ser gerado com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Ajustando preços e fórmulas de corte

- Tela **Materiais e Preços**: preços de perfil, vidro e acessórios (também editável via `npx prisma studio` dentro de `app/`).
- Tela **Empresa**: dados que aparecem no PDF.
- As fórmulas de corte (quanto de perfil, vidro e acessórios cada tipo de esquadria consome) ficam em
  [app/src/lib/calculo.ts](app/src/lib/calculo.ts), com parâmetros ajustáveis por tipo de esquadria
  (coluna `parametros`, em JSON, na tabela `TipoEsquadria`) — assim dá pra afinar os descontos de corte da sua
  linha de perfil específica sem mexer no código.

## Limitação conhecida (editar/duplicar orçamento)

Ao editar um orçamento em rascunho ou duplicá-lo, o cálculo é refeito do zero. A duplicação consome o estoque de
sobras normalmente (como um pedido novo). A edição, por segurança, **não mexe no estoque de sobras que já tinham
sido consumidas** na criação original (só remove/refaz os retalhos que aquela versão específica havia gerado) —
evita risco de contar a mesma sobra duas vezes, mas em casos raros pode ficar levemente desatualizado se você editar
muito as medidas depois de já ter consumido estoque.

