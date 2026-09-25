# Plano: sair do Stripe (Hotmart ou Paddle)

Atualizado em 27/09/2026.

## 0. Situação atual

- Conta Stripe brasileira no CPF do dono, que mora em Israel e não é mais residente fiscal no Brasil.
- **Nenhum cliente pagante hoje** (0 assinaturas ativas, 0 tratados avulsos; 1 usuário = o dono).
  → A troca pode ser feita de uma vez, sem migrar clientes e sem manter o Stripe em paralelo.
- O código de acesso ao conteúdo não depende do Stripe: ele só lê as tabelas `subscriptions` e
  `purchased_books`. A migração troca **quem escreve** nessas tabelas (o webhook), não o site.

## 1. Decisão (você) — antes de qualquer código

### O ponto fiscal

|                                                | Hotmart                                                                                                               | Paddle                                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Papel legal                                    | **Agente do produtor** — o produtor segue responsável por impostos e nota fiscal ao comprador (exceções: UE e México) | **Merchant of Record** — o Paddle é o vendedor legal, recolhe impostos e emite recibos |
| Resolve "vender sem documento brasileiro"?     | **Não garantido** — depende da resposta da Hotmart para o seu caso                                                    | Sim                                                                                    |
| Pix                                            | Sim (forte no Brasil)                                                                                                 | "Pix Automático"                                                                       |
| Boleto / parcelamento                          | Sim                                                                                                                   | Não / limitado                                                                         |
| Checkout em português, conhecido do brasileiro | Sim                                                                                                                   | Sim (menos conhecido)                                                                  |
| Recebimento em Israel                          | Confirmar (conta de produtor cadastrada fora do Brasil)                                                               | Sim (transferência bancária)                                                           |

Fontes: [Hotmart — Global sales, tax responsibilities](https://help.hotmart.com/en/article/27142347940749/global-sales-tax-responsibilities-for-sales-made-on-hotmart),
[Hotmart — business model updates](https://help.hotmart.com/en/article/20420081457549/global-sales-everything-you-need-to-know-about-hotmart-s-business-model-updates),
[Paddle — supported countries](https://developer.paddle.com/concepts/sell/supported-countries-locales/),
[Paddle — payment methods](https://www.paddle.com/help/start/intro-to-paddle/which-payment-methods-do-you-support).

### Pergunta para mandar ao suporte da Hotmart (copie e cole)

> Olá. Sou brasileiro, tenho CPF, mas moro em Israel há mais de 3 anos e não sou residente fiscal
> no Brasil. Quero vender assinaturas mensais/anuais e acesso avulso a um site de conteúdo digital
> (estudo religioso) para compradores no Brasil, recebendo em conta bancária em Israel.
>
> 1. Posso cadastrar minha conta de produtor com país = Israel, usando passaporte?
> 2. Nesse caso, nas vendas para compradores no Brasil, quem é responsável por recolher impostos
>    e emitir o documento fiscal ao comprador: eu ou a Hotmart?
> 3. Preciso emitir alguma nota fiscal brasileira ou ter CNPJ/MEI?
> 4. Os compradores no Brasil poderão pagar com Pix, boleto e cartão parcelado, em reais?
> 5. Assinaturas recorrentes (mensal e anual) funcionam nesse cenário?
> 6. Quais são as taxas por venda e o custo/prazo de saque para Israel?

**Regra de decisão:** se a Hotmart responder que _ela_ cuida do documento fiscal/impostos das
vendas para o Brasil no seu caso (ou que você não tem obrigação no Brasil), siga com a Hotmart.
Se responder que é _você_, use o Paddle. Em qualquer caso, confirme com o contador em Israel.

## 2. Configuração na plataforma (você, ~1 dia)

### Hotmart

1. Conta de produtor (país e dados bancários conforme a resposta do suporte).
2. Produtos:
   - **Or Halachá — Assinatura** (produto de assinatura) com 4 ofertas/planos:
     Mensal Básico R$ 99,90 · Mensal Plus R$ 119,90 · Anual Básico R$ 958,80/ano · Anual Plus R$ 1.078,80/ano
   - **Tratado avulso** (pagamento único, acesso por 1 mês) — 4 ofertas, uma por tratado
     (Orach Chayim, Yoreh De'ah, Even HaEzer, Choshen Mishpat), R$ 29,90
   - Garantia: 7 dias. Formas: Pix, cartão (parcelado no anual), boleto.
   - **Não** usar a área de membros da Hotmart — o conteúdo continua no site.
3. Webhook 2.0 (Ferramentas → Webhook): URL `https://www.or-halacha.com.br/api/webhooks/hotmart`,
   todos os eventos de compra e assinatura. Copiar o **hottok** da conta.
4. Na Vercel, criar: `HOTMART_HOTTOK`, e os links de checkout de cada oferta
   (`HOTMART_CHECKOUT_MENSAL`, `..._MENSAL_PLUS`, `..._ANUAL`, `..._ANUAL_PLUS`, `..._TRATADO_<id>`).
5. Me passar os códigos de oferta/produto (não são segredo).

### Paddle (se for o escolhido)

1. Conta, verificação e aprovação do domínio/produto.
2. Produtos e preços equivalentes (assinatura com 4 preços + avulso).
3. Webhook de notificações → `https://www.or-halacha.com.br/api/webhooks/paddle`; segredo na Vercel.
4. Customer Portal do Paddle ativado.

## 3. Código (Claude, ~2–3 dias + testes)

1. **Migration**: colunas `provider`, `external_subscription_id`, `external_transaction_id` em
   `subscriptions` e `purchased_books`; tabela `payment_events` (id do evento, payload, processado)
   para não processar o mesmo evento duas vezes e para auditoria.
2. **Checkout**: os botões "Assinar" e "Comprar tratado" passam a abrir o checkout da plataforma com:
   - e-mail do usuário pré-preenchido;
   - o **id do usuário** num parâmetro de rastreio do link (Hotmart: `xcod`/`sck`, que voltam no
     webhook em `purchase.origin`; Paddle: `custom_data`).
3. **Webhook** (`/api/webhooks/hotmart`):
   - valida o header `X-HOTMART-HOTTOK`;
   - compra aprovada/completa → libera (assinatura ou tratado por 1 mês);
   - reembolso, chargeback, cancelamento de compra → revoga;
   - pagamento atrasado → `past_due` (acesso suspenso);
   - cancelamento de assinatura → mantém acesso até o fim do período;
   - troca de plano → atualiza Básico/Plus e mensal/anual;
   - mudança da data de cobrança → atualiza o período.
   - _(nomes exatos de eventos e campos: conferir no painel de webhook da Hotmart com um evento de teste)_
4. **Identificar o comprador**: pelo id no link; se vier sem, pelo e-mail; se o e-mail não tiver
   conta, guardar a compra como pendente e vincular quando a pessoa criar a conta com esse e-mail.
5. **Perfil**: "Cancelar", "Trocar cartão/plano" e "Reembolso" passam a levar à área do comprador
   da plataforma (a Hotmart processa o reembolso dentro da garantia e avisa o site pelo webhook).
6. **Textos**: Política de compra/reembolso, Privacidade (operador de pagamento), Termos, FAQ e
   chatbot — trocar Stripe pela plataforma nova e incluir Pix/boleto/parcelamento.
7. **Remover o Stripe**: rotas de checkout/portal/reembolso Stripe, `lib/stripe.ts`,
   `lib/subscription-sync.ts`, webhook Stripe, pacote `stripe`, variáveis na Vercel.

## 4. Testes e virada (juntos, ~1 dia)

1. Eventos de teste do painel da plataforma → conferir liberação/revogação no site.
2. Compra real de valor baixo com Pix e com cartão → reembolso → acesso revogado.
3. Assinatura → cancelamento → acesso até o fim do período.
4. Desligar o Stripe: webhook, produtos e chaves; encerrar a conta depois.

## 5. Riscos e cuidados

- **Taxas**: conferir no painel a taxa por venda e o custo/prazo de saque para Israel.
- **Reembolso fora do site**: o comprador pode pedir direto na plataforma — o webhook precisa tratar.
- **E-mail diferente**: comprador paga com um e-mail e tem conta com outro — o vínculo pendente resolve.
- **Boleto**: só libera quando compensa (1–3 dias úteis); avisar na página de sucesso.
- **Imposto em Israel**: independente da plataforma, a receita é declarada em Israel (contador).
