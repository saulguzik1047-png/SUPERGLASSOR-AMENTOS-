# SUPERGLASSOR-AMENTOS-

App de orçamentos para serralheria (esquadrias de alumínio e vidro temperado). O código-fonte fica em [app/](app).

## O que o app faz

- Cadastro de clientes (nome, endereço, telefone).
- Novo orçamento: escolhe cliente, tipo de esquadria (janela/porta de correr, giro, fixo, basculante — 1, 2 ou mais folhas),
  informa largura/altura e a quantidade. O sistema calcula automaticamente:
  - metros/barras de perfil de alumínio necessários;
  - m² de vidro temperado;
  - rodízios, dobradiças, fechos, puxadores, cantoneiras, parafusos, silicone e fita de vedação.
- Campo de mão de obra e campo de desconto (com motivo) no próprio orçamento.
- Estoque de sobras: retalhos de perfil que sobram de cada corte são guardados automaticamente e reaproveitados nos
  próximos orçamentos; quando isso acontece, o app avisa na tela para você poder oferecer desconto ao cliente.
- Orçamentos ficam arquivados (lista com status: rascunho, enviado, aprovado, recusado).
- Botão para gerar o PDF do orçamento e botão para abrir o WhatsApp já com a mensagem pronta para o cliente
  (anexe o PDF baixado na conversa).

## Como rodar

```bash
cd app
npm install
npx prisma migrate deploy   # cria o banco (SQLite) com as tabelas
npm run seed                # cria os materiais e tipos de esquadria padrão
npm run dev                 # http://localhost:3000
```

## Ajustando preços e fórmulas de corte

- Tela **Estoque/Materiais**: os preços de perfil, vidro e acessórios ficam na tabela `Material` (banco de dados).
  Pode-se editar via Prisma Studio (`npx prisma studio` dentro de `app/`).
- As fórmulas de corte (quanto de perfil, vidro e acessórios cada tipo de esquadria consome) ficam em
  [app/src/lib/calculo.ts](app/src/lib/calculo.ts), com parâmetros ajustáveis por tipo de esquadria
  (coluna `parametros`, em JSON, na tabela `TipoEsquadria`) — assim dá pra afinar os descontos de corte da sua
  linha de perfil específica sem mexer no código.
