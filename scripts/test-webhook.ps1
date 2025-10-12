Write-Host "=== TESTANDO WEBHOOK COM DADOS REAIS ===" -ForegroundColor Green
Write-Host ""

$body = @{
    userId = "3f0e0184-c0a7-487e-b611-72890b39dcce"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-webhook" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "✅ Webhook testado com sucesso!" -ForegroundColor Green
    Write-Host "📊 Assinatura criada:" -ForegroundColor Yellow
    Write-Host "- Status: $($response.subscription.status)"
    Write-Host "- Plan Type: $($response.subscription.plan_type)"
    Write-Host "- Current Period Start: $($response.subscription.current_period_start)"
    Write-Host "- Current Period End: $($response.subscription.current_period_end)"
    Write-Host "- Explicação Prática: $($response.subscription.explicacao_pratica)"
    
    Write-Host "🔍 Debug da detecção Plus:" -ForegroundColor Cyan
    Write-Host "- Price ID: $($response.debug.priceId)"
    Write-Host "- É Plus: $($response.debug.isPlusSubscription)"
    Write-Host "- Detecção por Price ID: $($response.debug.detection.byPriceId)"
    Write-Host "- Detecção por Metadata: $($response.debug.detection.byMetadata)"
    Write-Host "- Detecção forçada: $($response.debug.detection.forced)"
    
} catch {
    Write-Host "❌ Erro no teste do webhook:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "=== TESTE CONCLUÍDO ===" -ForegroundColor Green
