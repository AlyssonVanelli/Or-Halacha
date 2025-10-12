# Página de Teste Stripe - Guia Completo

## 🧪 **Página de Teste Criada**

Acesse: **http://localhost:3000/test-stripe**

## 🎯 **O que a Página Testa**

### **1. Produtos de Teste**

- **Teste Mensal** - Assinatura mensal de R$ 29,90
- **Teste Anual** - Assinatura anual de R$ 299,90
- **Livro Teste** - Compra avulsa de R$ 19,90

### **2. Testes de Sistema**

- **Testar Webhook** - Simula evento do Stripe
- **Testar Banco** - Verifica dados no banco
- **Limpar** - Resetar página

### **3. Fluxo Completo**

1. **Criar Checkout** → Stripe
2. **Processar Pagamento** → Stripe
3. **Webhook** → Aplicação
4. **Sincronizar** → Banco de Dados

## 🔧 **Como Usar**

### **Passo 1: Acessar a Página**

```
http://localhost:3000/test-stripe
```

### **Passo 2: Testar Produto**

1. Clique em **"Testar Checkout"** em qualquer produto
2. Veja os logs no console (F12)
3. Será redirecionado para o Stripe

### **Passo 3: Completar Pagamento**

1. Use cartão de teste: `4242 4242 4242 4242`
2. Data: qualquer data futura
3. CVC: qualquer 3 dígitos
4. Complete o pagamento

### **Passo 4: Verificar Resultado**

1. Volte para a aplicação
2. Veja os logs no console
3. Verifique se os dados foram salvos no banco

## 🚨 **Onde Identificar o Problema**

### **1. Logs do Console (F12)**

```
=== INICIANDO TESTE DE CHECKOUT ===
=== TESTANDO WEBHOOK REAL ===
=== SINCRONIZANDO SUBSCRIPTION ===
```

### **2. Verificar Cada Etapa**

- ✅ **Checkout criado** - Session ID gerado
- ✅ **Pagamento processado** - Status complete
- ❌ **Webhook não executado** - Problema aqui
- ❌ **Dados não salvos** - Problema na sincronização

### **3. Endpoints de Debug**

- `/api/test-checkout` - Cria checkout
- `/api/test-real-stripe-webhook` - Processa webhook
- `/api/subscription/debug` - Verifica banco

## 🐛 **Problemas Comuns**

### **1. Webhook Não Executa**

**Sintoma:** Pagamento processado, mas dados não salvos
**Causa:** Webhook não configurado ou não funcionando
**Solução:** Verificar configuração do webhook no Stripe

### **2. Sincronização Falha**

**Sintoma:** Webhook executa, mas dados não salvos
**Causa:** Erro na sincronização com banco
**Solução:** Verificar logs de sincronização

### **3. Customer ID Não Encontrado**

**Sintoma:** "Usuário não encontrado para customer"
**Causa:** Customer ID não salvo no perfil
**Solução:** Verificar se customer foi criado corretamente

### **4. Datas Não Sincronizadas**

**Sintoma:** Status OK, mas datas NULL
**Causa:** Conversão de timestamp incorreta
**Solução:** Verificar conversão Unix → ISO

## 📊 **Logs Importantes**

### **Checkout Criado:**

```
✅ Checkout session criada: cs_test_xxx
Session URL: https://checkout.stripe.com/...
```

### **Webhook Executado:**

```
✅ Session encontrada: cs_test_xxx
✅ Subscription encontrada: sub_xxx
✅ Usuário encontrado: user_xxx
✅ Subscription sincronizada com sucesso
```

### **Dados Sincronizados:**

```
Dados sincronizados: {
  id: "sub_xxx",
  status: "active",
  current_period_start: "2024-01-01T00:00:00.000Z",
  current_period_end: "2024-02-01T00:00:00.000Z",
  explicacao_pratica: true
}
```

## 🎯 **Resultado Esperado**

Após completar o teste:

1. **✅ Checkout criado** com sucesso
2. **✅ Pagamento processado** no Stripe
3. **✅ Webhook executado** corretamente
4. **✅ Dados sincronizados** no banco
5. **✅ Datas salvas** corretamente
6. **✅ Status atualizado** corretamente

## 🚀 **Próximos Passos**

1. **Execute o teste** na página
2. **Identifique onde falha** pelos logs
3. **Corrija o problema** específico
4. **Teste novamente** até funcionar
5. **Verifique dados** no banco

---

## 🎉 **Conclusão**

A página de teste permite identificar **exatamente** onde está o problema na integração Stripe → Banco de Dados. Use os logs para encontrar a falha e corrigir o problema específico! 🚀
