Write-Host "=== FORÇANDO SINCRONIZAÇÃO COM STRIPE ===" -ForegroundColor Green
Write-Host ""

$body = @{
    userId = "3f0e0184-c0a7-487e-b611-72890b39dcce"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/force-sync-stripe" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "✅ Sincronização forçada com sucesso!" -ForegroundColor Green
    Write-Host "📊 Assinatura atualizada:" -ForegroundColor Yellow
    Write-Host "- Status: $($response.subscription.status)"
    Write-Host "- Plan Type: $($response.subscription.plan_type)"
    Write-Host "- Current Period Start: $($response.subscription.current_period_start)"
    Write-Host "- Current Period End: $($response.subscription.current_period_end)"
    Write-Host "- Explicação Prática: $($response.subscription.explicacao_pratica)"
    
    Write-Host "🔍 Dados do Stripe:" -ForegroundColor Cyan
    Write-Host "- Status no Stripe: $($response.stripeData.status)"
    Write-Host "- Cancelado em: $($response.stripeData.canceled_at)"
    Write-Host "- É Plus: $($response.stripeData.isPlus)"
    
    if ($response.stripeData.status -eq "canceled") {
        Write-Host "⚠️  ASSINATURA CANCELADA NO STRIPE - ATUALIZANDO BANCO" -ForegroundColor Red
    } else {
        Write-Host "✅ Assinatura ativa no Stripe" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Erro na sincronização:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "=== SINCRONIZAÇÃO CONCLUÍDA ===" -ForegroundColor Green
