# Pagamentos pela Hotmart

Atualizado em 01/10/2026. O código do site já está integrado à Hotmart e o Stripe foi removido
(a versão com Stripe fica no histórico do git, até o commit `6bd1126`).

## 1. Decisões

- **Hotmart como plataforma de pagamento.** Vendas de produtor cadastrado fora do Brasil são
  processadas pela Hotmart B.V. (Holanda). Comprador brasileiro paga com **Pix ou cartão**.
- **Plano anual à vista, sem parcelamento** (o "Parcelado Hotmart" só existe para contas
  brasileiras). Para compensar, o anual tem desconto maior: **4 meses grátis** em relação ao mensal.
- **Sem desconto de fidelidade** depois de alguns meses.

| Plano          | Preço         | Cobrança                 |
| -------------- | ------------- | ------------------------ |
| Mensal Básico  | R$ 99,90/mês  | todo mês                 |
| Mensal Plus    | R$ 119,90/mês | todo mês                 |
| Anual Básico   | R$ 799,00/ano | à vista, a cada 12 meses |
| Anual Plus     | R$ 959,00/ano | à vista, a cada 12 meses |
| Tratado avulso | R$ 29,90      | pagamento único, 1 mês   |

Os preços exibidos no site ficam em `lib/plans.ts`. **O valor cobrado é o do painel da Hotmart**:
mudou lá, mude também em `lib/plans.ts`.

## 2. O que já foi confirmado (pesquisa)

- Produtor fora do Brasil: Hotmart B.V. processa a venda; a Hotmart atua como agente e o produtor
  segue responsável pelos impostos do seu país
  ([Global sales](https://help.hotmart.com/en/article/20420081457549/global-sales-everything-you-need-to-know-about-hotmart-s-business-model-updates),
  [tax responsibilities](https://help.hotmart.com/en/article/27142347940749/global-sales-tax-responsibilities-for-sales-made-on-hotmart)).
- Link de checkout aceita `email` e `name` preenchidos e parâmetros de rastreio (`xcod`, `sck`), que
  voltam no webhook em `purchase.origin`
  ([parâmetros do checkout](https://help.hotmart.com/pt-br/article/115003588572/como-configurar-meus-parametros-da-pagina-de-pagamento-),
  [webhook de compra](https://developers.hotmart.com/docs/en/2.0.0/webhook/purchase-webhook/)).
- O comprador cancela, troca cartão e pede reembolso em <https://consumer.hotmart.com>
  ([cancelar compra](https://help.hotmart.com/pt-br/article/360038569752/como-posso-cancelar-a-minha-compra-)).
- Troca de plano pelo comprador existe e é habilitada pelo produtor
  ([troca de planos](https://help.hotmart.com/pt-br/article/360015376951/como-configurar-e-oferecer-troca-de-planos-de-assinatura-),
  [evento SWITCH_PLAN](https://developers.hotmart.com/docs/en/2.0.0/webhook/switch-plan-webhook/)).
- A partir de 2027 (LC 214/2025), plataformas do exterior passam a responder por IBS/CBS nas vendas
  ao Brasil.

### Ainda perguntar ao suporte da Hotmart

1. Para comprador no Brasil, o cartão é cobrado em **reais** ou em dólar (com IOF de 3,5%)?
2. As **renovações** das assinaturas (mensal e anual) aceitam **Pix**, ou só cartão?
3. Valor mínimo, taxa e prazo de **saque em USD para conta em Israel**.

## 3. Passo a passo no painel (você)

1. **Conta de produtor com país = Israel** (documento de Israel, comprovante de endereço de até 90
   dias e selfie; saque o saldo antes de mudar o país).
2. **Produto "Or Halachá — Assinatura"** (tipo assinatura, **sem área de membros**: o conteúdo fica
   no site). Crie 4 planos com estes nomes exatos (o site também reconhece pelo nome):
   - `Mensal Básico` — R$ 99,90, mensal
   - `Mensal Plus` — R$ 119,90, mensal
   - `Anual Básico` — R$ 799,00, anual
   - `Anual Plus` — R$ 959,00, anual
   - Formas de pagamento: **Pix e cartão**. **Desative o parcelamento.** Garantia: **7 dias**.
   - Ative a **troca de plano** entre os 4 planos (Precificação → ⋮ → Configurar troca de plano).
3. **Produto "Or Halachá — Tratado avulso"** (pagamento único, sem área de membros), garantia de 7
   dias, Pix e cartão, com 4 ofertas de R$ 29,90 chamadas:
   `Tratado Orach Chayim`, `Tratado Yoreh De'ah`, `Tratado Even HaEzer`, `Tratado Choshen Mishpat`.
4. **Página de obrigado** dos dois produtos: `https://www.or-halacha.com.br/payment/success`.
5. **Webhook 2.0** (Ferramentas → Webhook): URL `https://www.or-halacha.com.br/api/webhooks/hotmart`,
   versão 2.0.0, marcando: compra aprovada, completa, cancelada, reembolsada, chargeback, atrasada,
   cancelamento de assinatura, troca de plano e alteração de data de cobrança. Copie o **hottok**.
6. **Vercel → Environment Variables (Production)**: `HOTMART_HOTTOK` e os 8 links de checkout
   (`HOTMART_CHECKOUT_*`, ver [environment-variables.md](./environment-variables.md)) — cada link é o
   da oferta/plano, **com o `?off=...`**. Depois, **Redeploy**.
7. Apague da Vercel as variáveis antigas do Stripe (`STRIPE_*`, `NEXT_PUBLIC_STRIPE_PRICE_*`).

## 4. Testes antes de divulgar (juntos)

1. No painel do webhook, **Enviar teste**: deve responder 200. O evento aparece em
   `payment_events` (o de teste fica como `pending_user` ou `error`, porque os dados são fictícios).
2. **Compra real barata**: tratado avulso por Pix, logado no site → a página de obrigado mostra
   "Acesso liberado" → o tratado abre inteiro.
3. **Reembolso** dessa compra em consumer.hotmart.com → o acesso ao tratado acaba sozinho.
4. **Assinatura mensal** → acesso completo → **cancelar a renovação** na Hotmart → o perfil mostra
   "Renovação cancelada, acesso até …" → **reembolso** → acesso encerrado.

## 5. Como funciona (técnico)

- **Botões "Assinar"/"Comprar"** → `/checkout/<plano>` ou `/checkout/<id do tratado>`
  (`app/checkout/[item]/route.ts`): exige login (sem login → cadastro, e depois de confirmar o
  e-mail a pessoa volta para o checkout), bloqueia assinatura em dobro e redireciona (HTTP 307) para
  o link da Hotmart com `email`, `name` e o id da conta em `xcod`/`sck`.
- **Webhook** `app/api/webhooks/hotmart/route.ts` → `lib/hotmart-events.ts`:
  - valida `X-HOTMART-HOTTOK`; grava cada evento em `payment_events` (sem CPF, endereço, telefone
    ou dados do Pix) e ignora eventos repetidos;
  - identifica o produto pelo código da oferta (`off=` dos links), pelo metadado `plano` da oferta
    ou, por último, pelo nome do plano/oferta;
  - identifica a conta pelo `xcod`/`sck`; sem isso, pelo e-mail do comprador; sem conta com esse
    e-mail, a compra fica **pendente** e é vinculada quando a pessoa cria a conta com o mesmo e-mail
    (ao abrir o dashboard, o perfil ou a página de obrigado);
  - `PURCHASE_APPROVED` → libera (assinatura até a próxima cobrança + 3 dias de tolerância; tratado
    por 1 mês, somando ao que restar); `PURCHASE_COMPLETE` só confirma;
    `PURCHASE_REFUNDED`/`CHARGEBACK` → encerra o acesso na hora; `PURCHASE_CANCELED` → encerra se for
    a transação que liberou o acesso; `SUBSCRIPTION_CANCELLATION` → acesso até a data já paga;
    `SWITCH_PLAN` → muda Básico/Plus e mensal/anual; `UPDATE_SUBSCRIPTION_CHARGE_DATE` → nova data;
    `PURCHASE_DELAYED` → marca "pagamento pendente" quando o período já acabou;
  - erro de banco → responde 500 e a Hotmart reenvia; produto não reconhecido → fica `error` em
    `payment_events` para reprocessar.
- **Perfil** (`components/BillingSection.tsx` + `/api/account/billing`): plano, próxima cobrança,
  tratados, histórico e o atalho para a área do comprador da Hotmart.
- **Exclusão de conta**: bloqueada enquanto a assinatura renova (a cobrança é da Hotmart; a pessoa
  cancela a renovação lá primeiro).

### Operação

Eventos com problema (SQL do Supabase):

```sql
select id, event, status, item, error, buyer_email, created_at
from payment_events where status in ('error', 'pending_user') order by created_at desc;
```

Depois de corrigir a configuração (ex.: um link sem `off=` na Vercel), reaplique os eventos com erro:

```bash
curl -X POST https://www.or-halacha.com.br/api/admin/hotmart/reprocessar -H "Authorization: Bearer $ADMIN_SECRET_TOKEN"
```

## 6. Cuidados

- **Taxas**: conferir no painel a taxa por venda e o custo/prazo de saque para Israel.
- **E-mail diferente**: quem paga com outro e-mail tem a compra vinculada ao criar conta com aquele
  e-mail; se já tiver conta com outro, o suporte resolve (reprocessar ou ajustar no banco).
- **Imposto em Israel**: a receita é declarada em Israel (contador).
