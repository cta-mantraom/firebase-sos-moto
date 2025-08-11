import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Heart, XCircle, RefreshCw } from 'lucide-react';

const Failure: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')} 
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-emergency rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Memoryys</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="card-emergency text-center">
            <CardHeader className="bg-gradient-to-r from-destructive-light to-destructive-light/50 rounded-t-lg">
              <CardTitle className="flex items-center justify-center gap-2 text-slate-900">
                <XCircle className="w-6 h-6 text-destructive" />
                Pagamento não processado
              </CardTitle>
              <CardDescription className="text-slate-700">
                Houve um problema com o processamento do seu pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Não se preocupe! Isso pode acontecer por diversos motivos, como:
                </p>
                
                <ul className="text-left text-sm text-muted-foreground space-y-2 bg-muted p-4 rounded-lg">
                  <li>• Problema temporário com o processador de pagamentos</li>
                  <li>• Dados do cartão incorretos ou insuficientes</li>
                  <li>• Limite de cartão atingido</li>
                  <li>• Conexão instável durante o processo</li>
                </ul>
                
                <div className="space-y-3 pt-4">
                  <Button 
                    onClick={() => navigate('/create')}
                    className="w-full btn-emergency"
                    size="lg"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/')}
                    className="w-full"
                  >
                    Voltar ao Início
                  </Button>
                </div>
                
                <div className="text-left space-y-2 bg-warning-light p-4 rounded-lg border border-warning/20">
                  <h4 className="font-semibold text-sm text-slate-900">
                    Precisa de ajuda?
                  </h4>
                  <p className="text-sm text-slate-700">
                    Entre em contato conosco através do email 
                    <span className="font-semibold"> suporte@memoryys.com</span> ou 
                    WhatsApp <span className="font-semibold">(11) 99999-9999</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Failure;