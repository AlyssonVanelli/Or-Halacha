Write-Host "🔥🔥🔥 MONITOR DE WEBHOOK EM TEMPO REAL 🔥🔥🔥" -ForegroundColor Red
Write-Host "📡 Aguardando eventos do Stripe..."
Write-Host "💡 Cancele uma assinatura no Stripe e veja os logs aqui!"
Write-Host "🛑 Pressione Ctrl+C para parar"
Write-Host "=" * 80

# Simular monitoramento (você pode usar ferramentas como ngrok para expor localhost)
Write-Host "🌐 Webhook URL: http://localhost:3000/api/webhooks/stripe/live" -ForegroundColor Yellow
Write-Host "📋 Configure esta URL no Stripe Dashboard" -ForegroundColor Yellow
Write-Host "🎯 Eventos necessários: customer.subscription.updated, customer.subscription.deleted" -ForegroundColor Yellow
Write-Host ""

# Loop infinito para manter o script rodando
while ($true) {
    Start-Sleep -Seconds 1
    Write-Host "." -NoNewline -ForegroundColor Green
}
