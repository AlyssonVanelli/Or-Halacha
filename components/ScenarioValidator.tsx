'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  Shield,
  CreditCard,
  Clock,
  RefreshCw
} from 'lucide-react'
import { 
  validateUpgradeScenario,
  UPGRADE_SCENARIOS,
  type ValidationResult 
} from '@/lib/subscription-scenarios'

interface ScenarioValidatorProps {
  userId: string
  currentSubscriptionId: string | null
  newPlanId: string
  userAuthenticated: boolean
  onValidationComplete: (result: ValidationResult) => void
}

export default function ScenarioValidator({
  userId,
  currentSubscriptionId,
  newPlanId,
  userAuthenticated,
  onValidationComplete,
}: ScenarioValidatorProps) {
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [scenarios, setScenarios] = useState(UPGRADE_SCENARIOS)

  useEffect(() => {
    validateScenario()
  }, [userId, currentSubscriptionId, newPlanId, userAuthenticated])

  const validateScenario = async () => {
    setLoading(true)
    try {
      const result = await validateUpgradeScenario(
        userId,
        currentSubscriptionId,
        newPlanId,
        userAuthenticated
      )
      setValidation(result)
      onValidationComplete(result)
    } catch (error) {
      console.error('Erro na validação:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'high':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2">Validando cenário...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resultado da Validação */}
      {validation && (
        <Card className={validation.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validation.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Validação do Cenário
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validation.errors.length > 0 && (
              <Alert className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Erros encontrados:</strong>
                  <ul className="mt-2 list-disc list-inside">
                    {validation.errors.map((error, index) => (
                      <li key={index} className="text-red-700">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {validation.warnings.length > 0 && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Avisos:</strong>
                  <ul className="mt-2 list-disc list-inside">
                    {validation.warnings.map((warning, index) => (
                      <li key={index} className="text-yellow-700">{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validation.requiresConfirmation && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Este upgrade requer confirmação adicional devido às condições especiais.
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Custo Estimado:</strong>
                <span className="ml-2">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(validation.estimatedCost)}
                </span>
              </div>
              <div>
                <strong>Próxima Cobrança:</strong>
                <span className="ml-2">
                  {new Date(validation.nextBillingDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Todos os Cenários Possíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Todos os Cenários Possíveis
          </CardTitle>
          <CardDescription>
            Análise completa de todos os cenários de upgrade/renewal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getRiskIcon(scenario.riskLevel)}
                  <div>
                    <h4 className="font-medium">{scenario.name}</h4>
                    <p className="text-sm text-gray-600">{scenario.description}</p>
                    {scenario.errorMessage && (
                      <p className="text-sm text-red-600 mt-1">{scenario.errorMessage}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={getRiskColor(scenario.riskLevel)}>
                    {scenario.riskLevel.toUpperCase()}
                  </Badge>
                  
                  {scenario.isAllowed ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Permitido
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      Bloqueado
                    </Badge>
                  )}
                  
                  {scenario.requiresSpecialHandling && (
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      <Shield className="h-3 w-3 mr-1" />
                      Especial
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {scenarios.filter(s => s.isAllowed).length}
            </div>
            <div className="text-sm text-gray-600">Permitidos</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {scenarios.filter(s => !s.isAllowed).length}
            </div>
            <div className="text-sm text-gray-600">Bloqueados</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {scenarios.filter(s => s.requiresSpecialHandling).length}
            </div>
            <div className="text-sm text-gray-600">Especiais</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {scenarios.filter(s => s.riskLevel === 'high').length}
            </div>
            <div className="text-sm text-gray-600">Alto Risco</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
