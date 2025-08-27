import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Shield, Clock, Phone, QrCode, CheckCircle, ArrowRight, Star, Users, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Clock className="w-6 h-6 text-primary" />,
      title: "Acesso Instantâneo",
      description: "Informações médicas acessíveis em segundos através do QR Code"
    },
    {
      icon: <Shield className="w-6 h-6 text-secondary" />,
      title: "Dados Críticos",
      description: "Tipo sanguíneo, alergias e condições médicas sempre disponíveis"
    },
    {
      icon: <Phone className="w-6 h-6 text-success" />,
      title: "Contatos Diretos",
      description: "Familiares e médicos contatados automaticamente em emergências"
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-warning" />,
      title: "Disponível 24h",
      description: "Funciona mesmo offline - informações sempre acessíveis"
    }
  ];

  const stats = [
    {
      number: "400K+",
      label: "Motociclistas no Brasil",
      color: "text-primary"
    },
    {
      number: "35%",
      label: "Redução no tempo de atendimento",
      color: "text-secondary"
    },
    {
      number: "24h",
      label: "Acesso às informações",
      color: "text-success"
    }
  ];

  const plans = [
    {
      id: 'basic',
      name: 'Plano Básico',
      price: 'R$ 55,00',
      description: 'Ideal para proteção médica essencial',
      badge: 'Mais Popular',
      badgeColor: 'bg-warning text-warning-foreground',
      features: [
        'QR Code digital personalizado',
        '3 alterações por ano',
        'Validade de 3 anos',
        'Acesso 24/7 às informações',
        'Suporte via email'
      ],
      buttonVariant: 'emergency' as const,
      buttonText: 'Escolher Plano Básico'
    },
    {
      id: 'premium',
      name: 'Plano Premium',
      price: 'R$ 85,00',
      description: 'Proteção completa com recursos avançados',
      badge: 'Recomendado',
      badgeColor: 'bg-secondary text-secondary-foreground',
      features: [
        'QR Code digital + físico enviado',
        '3 alterações por ano',
        'Validade de 2 anos',
        'Acesso 24/7 às informações',
        'Suporte prioritário',
        'Cartão físico resistente'
      ],
      buttonVariant: 'medical' as const,
      buttonText: 'Escolher Plano Premium'
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Escolha seu plano",
      description: "Selecione o plano que melhor atende suas necessidades",
      icon: <Star className="w-5 h-5" />
    },
    {
      number: "2",
      title: "Preencha seus dados",
      description: "Adicione informações médicas essenciais e contatos de emergência",
      icon: <Heart className="w-5 h-5" />
    },
    {
      number: "3",
      title: "Receba seu QR Code",
      description: "QR Code personalizado enviado por email instantaneamente",
      icon: <QrCode className="w-5 h-5" />
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-emergency rounded-xl flex items-center justify-center shadow-emergency">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-base">Memoryysboy</h1>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/create')} 
            className="btn-emergency hover:scale-105 transform transition-all duration-300 font-medium text-xs"
          >
            Criar Meu QR Code
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95"></div>
        <div className="relative container mx-auto px-4 py-20 text-center text-white">
          <div className="max-w-4xl mx-auto space-y-8">
            <Badge className="bg-white/20 text-white border-white/30 mb-6">
              Sempre disponíveis quando mais precisar
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              <span className="block">Memoryysboy</span>
              <span className="block text-white/90 text-2xl md:text-3xl font-normal mt-2">
                Proteja sua vida com informações médicas sempre acessíveis em emergências
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
              Tenha suas informações médicas sempre acessíveis.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button 
                size="lg" 
                onClick={() => navigate('/create')} 
                className="bg-white text-primary hover:bg-white/90 shadow-elegant px-8 py-4 text-lg font-semibold"
              >
                Criar Meu QR Code SOS
                <QrCode className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:text-primary px-8 py-4 text-lg bg-red-700 hover:bg-red-600"
              >
                Como Funciona
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-white/80">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Recursos Que Salvam Vidas
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tecnologia avançada para garantir que suas informações médicas estejam 
              sempre disponíveis quando mais precisar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-emergency hover:scale-105 transform transition-all duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 mx-auto bg-gradient-subtle rounded-full flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-muted-foreground">
              Em 3 passos simples, você terá sua proteção médica sempre acessível
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 mx-auto bg-gradient-emergency rounded-full flex items-center justify-center mb-6 shadow-emergency float-animation">
                  <span className="text-2xl font-bold text-white">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center justify-center gap-2">
                  {step.icon}
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full">
                    <ArrowRight className="w-6 h-6 text-muted-foreground mx-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Escolha seu Plano
            </h2>
            <p className="text-xl text-muted-foreground">
              Todos os planos incluem 3 alterações por ano e validade de 2 anos
            </p>
            <div className="flex items-center justify-center gap-2 mt-6">
              <Shield className="w-5 h-5 text-success" />
              <span className="text-sm text-success font-medium">Pagamento seguro via MercadoPago</span>
              <Users className="w-5 h-5 text-secondary ml-4" />
              <span className="text-sm text-secondary font-medium">Suporte 24/7</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.id} className="card-emergency relative overflow-hidden hover:scale-105 transform transition-all duration-300">
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <Badge className={plan.badgeColor}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl text-foreground">{plan.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {plan.description}
                  </CardDescription>
                  <div className="text-4xl font-bold text-primary mt-4">
                    {plan.price}
                    <span className="text-lg font-normal text-muted-foreground ml-2">
                      pagamento único
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    size="lg" 
                    className={plan.buttonVariant === 'emergency' ? 'btn-emergency w-full' : 'btn-medical w-full'}
                    onClick={() => navigate('/create')}
                  >
                    {plan.buttonText}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-emergency"></div>
        <div className="relative container mx-auto px-4 text-center text-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Sua Segurança Não Pode Esperar
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Junte-se a milhares de motociclistas que já protegem suas vidas com o Memoryysboy
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/create')} 
              className="bg-white text-primary hover:bg-white/90 shadow-elegant px-8 py-4 text-lg font-semibold pulse-emergency"
            >
              Criar Meu QR Code Agora
              <QrCode className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-emergency rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold">Memoryysboy</span>
                <p className="text-xs text-slate-400">Sistema de Emergência Médica</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-slate-400 text-sm">
                © 2024 Memoryysboy. Tecnologia que salva vidas.
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Todos os direitos reservados
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;