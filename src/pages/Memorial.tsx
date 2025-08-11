import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Heart, Phone, AlertTriangle, Calendar, Mail, User } from 'lucide-react';

interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

interface MemorialData {
  name: string;
  age: number;
  phone: string;
  email: string;
  blood_type?: string;
  allergies?: string[];
  medications?: string[];
  medical_conditions?: string[];
  health_plan?: string;
  preferred_hospital?: string;
  emergency_contacts: EmergencyContact[];
}

interface MemorialState {
  data: MemorialData | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
  correlationId: string | null;
  dataSource: "redis" | "database" | null;
}

const Memorial: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<MemorialState>({
    data: null,
    loading: true,
    error: null,
    retryCount: 0,
    correlationId: null,
    dataSource: null
  });

  const fetchMemorialData = async (retryAttempt: number = 0) => {
    if (!id) {
      setState(prev => ({
        ...prev,
        error: 'ID do memorial não encontrado',
        loading: false
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      retryCount: retryAttempt
    }));

    try {
      console.log(`Tentativa ${retryAttempt + 1} - Buscando memorial: ${id}`);
      
      // Buscar dados do perfil via API
      const response = await fetch(`/api/get-profile?id=${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Memorial não encontrado ou ainda não processado`);
      }
      
      const responseData = await response.json();
      console.log('Resposta da API:', responseData);

      // Verificar se a resposta tem o formato correto
      if (responseData.success && responseData.data) {
        setState(prev => ({
          ...prev,
          data: responseData.data,
          loading: false,
          correlationId: responseData.correlationId,
          dataSource: responseData.source
        }));
        console.log(`✅ Memorial carregado via ${responseData.source} (correlationId: ${responseData.correlationId})`);
      } else if (responseData.success === false) {
        throw new Error(responseData.error || 'Dados não encontrados');
      } else {
        // Fallback para formato antigo
        setState(prev => ({
          ...prev,
          data: responseData,
          loading: false,
          dataSource: "redis"
        }));
        console.log('✅ Memorial carregado (formato legacy)');
      }
    } catch (err) {
      console.error(`❌ Erro na tentativa ${retryAttempt + 1}:`, err);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar memorial';
      
      // Retry logic com exponential backoff
      if (retryAttempt < 2) {
        const delay = Math.pow(2, retryAttempt) * 1000; // 1s, 2s
        console.log(`⏱️ Tentando novamente em ${delay}ms...`);
        
        setTimeout(() => {
          fetchMemorialData(retryAttempt + 1);
        }, delay);
      } else {
        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false
        }));
      }
    }
  };

  useEffect(() => {
    fetchMemorialData();
  }, [id]);

  const handleRetry = () => {
    fetchMemorialData(0);
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-48 mx-auto mb-2"></div>
          {state.retryCount > 0 && (
            <div className="text-sm text-muted-foreground">
              Tentativa {state.retryCount + 1}...
            </div>
          )}
        </div>
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Memorial não encontrado</h2>
            <p className="text-muted-foreground text-sm mb-4">
              {state.error || 'Este memorial pode não existir ou ainda estar sendo processado.'}
            </p>
            
            {state.correlationId && (
              <p className="text-xs text-muted-foreground mb-4">
                ID de rastreamento: {state.correlationId}
              </p>
            )}
            
            <button 
              onClick={handleRetry}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Tentar novamente
            </button>
            
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">
                Problemas persistentes? Entre em contato:
              </p>
              <div className="space-y-1">
                <p className="text-xs">
                  <strong>Email:</strong> suporte@memoryys.com
                </p>
                <p className="text-xs">
                  <strong>WhatsApp:</strong> (11) 99999-9999
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-gradient-emergency text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold">PERFIL DE EMERGÊNCIA</h1>
          </div>
          <p className="text-white/90 text-sm">
            Em caso de emergência, use estas informações para prestar socorro
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Identificação Principal */}
          <Card className="card-emergency">
            <CardHeader className="bg-gradient-to-r from-primary-light to-primary-light/50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <User className="w-5 h-5" />
                Identificação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {state.data.name}
                  </h2>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {state.data.age} anos
                  </p>
                  {state.dataSource && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Dados carregados via {state.dataSource === "redis" ? "cache" : "banco de dados"}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${state.data.phone}`} className="text-primary hover:underline">
                      {state.data.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{state.data.email}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Médicas */}
          <Card className="card-emergency">
            <CardHeader className="bg-gradient-to-r from-destructive-light to-destructive-light/50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Heart className="w-5 h-5" />
                Informações Médicas Críticas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {state.data.blood_type && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Tipo Sanguíneo</h4>
                  <Badge variant="destructive" className="text-lg px-3 py-1">
                    {state.data.blood_type}
                  </Badge>
                </div>
              )}

              {state.data.allergies && state.data.allergies.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-destructive">⚠️ Alergias</h4>
                  <div className="bg-destructive-light p-3 rounded-lg">
                    <ul className="text-sm space-y-1">
                      {state.data.allergies.map((allergy, index) => (
                        <li key={index}>• {allergy}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {state.data.medications && state.data.medications.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Medicamentos em Uso</h4>
                  <div className="bg-warning-light p-3 rounded-lg">
                    <ul className="text-sm space-y-1">
                      {state.data.medications.map((medication, index) => (
                        <li key={index}>• {medication}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {state.data.medical_conditions && state.data.medical_conditions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Condições Médicas</h4>
                  <div className="bg-muted p-3 rounded-lg">
                    <ul className="text-sm space-y-1">
                      {state.data.medical_conditions.map((condition, index) => (
                        <li key={index}>• {condition}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {state.data.health_plan && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Plano de Saúde</h4>
                  <p className="text-sm bg-muted p-3 rounded-lg">{state.data.health_plan}</p>
                </div>
              )}

              {state.data.preferred_hospital && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Hospital de Preferência</h4>
                  <p className="text-sm bg-muted p-3 rounded-lg">{state.data.preferred_hospital}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contatos de Emergência */}
          <Card className="card-emergency">
            <CardHeader className="bg-gradient-to-r from-success-light to-success-light/50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Phone className="w-5 h-5" />
                Contatos de Emergência
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {state.data.emergency_contacts.map((contact, index) => (
                  <div key={index} className="bg-success-light p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900">{contact.name}</h4>
                        <p className="text-sm text-slate-700 capitalize">{contact.relationship}</p>
                      </div>
                      <a 
                        href={`tel:${contact.phone}`}
                        className="bg-success text-white px-4 py-2 rounded-lg hover:bg-success/90 transition-colors text-sm font-medium"
                      >
                        Ligar: {contact.phone}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Footer de Emergência */}
          <Card className="bg-gradient-emergency text-white">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">EM CASO DE EMERGÊNCIA</span>
              </div>
              <p className="text-white/90 text-sm mb-4">
                Ligue imediatamente para o SAMU (192) ou Bombeiros (193)
              </p>
              <div className="flex justify-center gap-4">
                <a 
                  href="tel:192" 
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  SAMU: 192
                </a>
                <a 
                  href="tel:193" 
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Bombeiros: 193
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Memorial;