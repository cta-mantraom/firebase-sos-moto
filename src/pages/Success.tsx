import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Heart, CheckCircle, Loader2, ExternalLink } from 'lucide-react';

const Success: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processando' | 'pronto'>('processando');
  const [memorialUrl, setMemorialUrl] = useState<string>('');
  const uniqueId = searchParams.get('id');

  useEffect(() => {
    if (!uniqueId) {
      toast({
        title: "ID não encontrado",
        description: "Redirecionando para página inicial...",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/check-status?id=${uniqueId}`);
        const data = await response.json();

        if (data.status === 'pronto') {
          setStatus('pronto');
          setMemorialUrl(`${window.location.origin}/memorial/${uniqueId}`);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    };

    const interval = setInterval(checkStatus, 4000);
    checkStatus(); // Check immediately

    return () => clearInterval(interval);
  }, [uniqueId, navigate]);

  const openMemorial = () => {
    window.open(memorialUrl, '_blank');
  };

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
          {status === 'processando' ? (
            <Card className="card-emergency text-center">
              <CardHeader className="bg-gradient-to-r from-warning-light to-warning-light/50 rounded-t-lg">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processando seu perfil...
                </CardTitle>
                <CardDescription>
                  Aguarde enquanto finalizamos a criação do seu memorial de emergência
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="w-32 h-32 bg-muted rounded-lg mx-auto mb-4"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Este processo pode levar alguns instantes...
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="card-emergency text-center">
              <CardHeader className="bg-gradient-to-r from-success-light to-success-light/50 rounded-t-lg">
                <CardTitle className="flex items-center justify-center gap-2 text-slate-900">
                  <CheckCircle className="w-6 h-6 text-success" />
                  Memorial criado com sucesso!
                </CardTitle>
                <CardDescription className="text-slate-700">
                  Seu perfil de emergência está pronto e ativo
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {memorialUrl && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border-2 border-primary/20 inline-block">
                      <QRCodeSVG
                        value={memorialUrl}
                        size={200}
                        level="M"
                        includeMargin={true}
                        fgColor="#000000"
                        bgColor="#ffffff"
                      />
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Use este QR Code ou o link abaixo para acessar seu memorial:
                      </p>

                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-mono break-all text-muted-foreground">
                          {memorialUrl}
                        </p>
                      </div>

                      <Button
                        onClick={openMemorial}
                        className="w-full btn-emergency"
                        size="lg"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver meu Memorial
                      </Button>
                    </div>
                  </div>
                )}

                <div className="text-left space-y-2 bg-primary-light p-4 rounded-lg">
                  <h4 className="font-semibold text-sm">Próximos passos:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Cole o QR Code em local visível (capacete, moto, etc.)</li>
                    <li>• Compartilhe o link com pessoas próximas</li>
                    <li>• Verifique seu email para mais detalhes</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Success;