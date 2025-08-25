import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { QRCodePreview } from '@/components/QRCodePreview';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { MercadoPagoCheckout } from '@/components/MercadoPagoCheckout';
import { ArrowLeft, Heart, User, Phone, AlertTriangle, QrCode, CreditCard } from 'lucide-react';
import { FormData, Plan, CheckoutData } from '@/types';
import { PaymentCache } from '@/utils/paymentCache';

const CreateProfile: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium'>('basic');
  const [formData, setFormData] = useState<FormData>({
    nomeCompleto: '',
    idade: '',
    telefone: '',
    email: '',
    tipoSanguineo: '',
    alergias: '',
    medicamentos: '',
    condicoesMedicas: '',
    planoSaude: '',
    hospitalPreferencia: '',
    observacoesMedicas: '',
    contatoPrimarioNome: '',
    contatoPrimarioTelefone: '',
    contatoPrimarioRelacao: '',
    contatoSecundarioNome: '',
    contatoSecundarioTelefone: '',
    contatoSecundarioRelacao: ''
  });
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showCheckout, setShowCheckout] = useState(false);

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Recuperar dados do cache se existirem
  useEffect(() => {
    const cachedData = PaymentCache.get();
    if (cachedData && cachedData.formData) {
      console.log('[CreateProfile] Recovered data from cache');
      const cached = cachedData.formData;
      
      // Mapear dados do cache para o formato do formulário
      setFormData({
        nomeCompleto: cached.name || '',
        idade: cached.age?.toString() || '',
        telefone: cached.phone || '',
        email: cached.email || '',
        tipoSanguineo: cached.bloodType || '',
        alergias: cached.allergies?.join(', ') || '',
        medicamentos: cached.medications?.join(', ') || '',
        condicoesMedicas: cached.medicalConditions?.join(', ') || '',
        planoSaude: cached.healthPlan || '',
        hospitalPreferencia: cached.preferredHospital || '',
        observacoesMedicas: cached.medicalNotes || '',
        contatoPrimarioNome: cached.emergencyContacts?.[0]?.name || '',
        contatoPrimarioTelefone: cached.emergencyContacts?.[0]?.phone || '',
        contatoPrimarioRelacao: cached.emergencyContacts?.[0]?.relationship || '',
        contatoSecundarioNome: cached.emergencyContacts?.[1]?.name || '',
        contatoSecundarioTelefone: cached.emergencyContacts?.[1]?.phone || '',
        contatoSecundarioRelacao: cached.emergencyContacts?.[1]?.relationship || ''
      });
      
      setSelectedPlan(cached.selectedPlan || 'basic');
      
      // Informar usuário
      const ageMinutes = PaymentCache.getAge();
      if (ageMinutes !== null && ageMinutes > 0) {
        toast({
          title: "Dados recuperados",
          description: `Recuperamos seus dados salvos há ${ageMinutes} minuto(s).`,
        });
      }
    }
  }, []); // Executar apenas uma vez na montagem
  
  // Generate QR code URL based on form data
  useEffect(() => {
    if (formData.nomeCompleto) {
      const baseUrl = window.location.origin + '/profile/';
      const userId = formData.nomeCompleto.toLowerCase().replace(/\s+/g, '') + 
                    Math.random().toString(36).substr(2, 6);
      setQrCodeUrl(`${baseUrl}${userId}`);
    }
  }, [formData.nomeCompleto]);

  const isFormValid = !!(
    formData.nomeCompleto && 
    formData.idade && 
    formData.telefone && 
    formData.email && 
    formData.tipoSanguineo && 
    formData.contatoPrimarioNome && 
    formData.contatoPrimarioTelefone
  );

  const handleConfirmPayment = () => {
    if (!isFormValid) return;
    setShowConfirmModal(false);
    setShowCheckout(true);
  };

  const handlePaymentSuccess = (paymentData: unknown, uniqueUrl: string) => {
    // Este método agora é chamado APENAS após confirmação real do pagamento via polling
    console.log('✅ Payment CONFIRMED by webhook:', paymentData, 'UniqueURL:', uniqueUrl);
    
    toast({
      title: "Pagamento aprovado!",
      description: "Seu perfil de emergência foi criado com sucesso.",
      duration: 5000,
    });
    
    // Pequeno delay para o usuário ver a mensagem de sucesso
    setTimeout(() => {
      // Agora sim podemos redirecionar - pagamento foi confirmado
      navigate(`/success?id=${uniqueUrl}`);
    }, 1500);
  };

  const handlePaymentError = (error: Error) => {
    console.error('Payment error:', error);
    toast({
      title: "Erro no pagamento",
      description: "Tente novamente em alguns instantes.",
      variant: "destructive"
    });
    setShowCheckout(false);
  };

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Plano Básico',
      price: 'R$ 55,00',
      description: 'Proteção médica essencial',
      popular: true,
      features: [
        'QR Code digital personalizado',
        '3 alterações por ano',
        'Validade de 3 anos',
        'Acesso 24/7 às informações',
        'Suporte via email'
      ]
    },
    {
      id: 'premium',
      name: 'Plano Premium',
      price: 'R$ 85,00',
      description: 'Proteção completa + cartão físico',
      popular: false,
      features: [
        'QR Code digital personalizado',
        'Cartão físico enviado pelos Correios',
        '3 alterações por ano',
        'Validade de 2 anos',
        'Acesso 24/7 às informações',
        'Suporte prioritário'
      ]
    }
  ];

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
              <span className="text-xl font-bold text-foreground">Memoryysboy</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Form Section */}
          <div className="space-y-6">
            {/* Plan Selection */}
            <Card className="card-emergency">
              <CardHeader className="bg-gradient-to-r from-warning-light to-warning-light/50 rounded-t-lg">
                <CardTitle className="text-slate-900">Escolha seu Plano</CardTitle>
                <CardDescription className="text-slate-700">
                  Selecione o plano que melhor atende suas necessidades
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map((plan) => (
                    <div 
                      key={plan.id}
                      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPlan === plan.id 
                          ? 'border-primary bg-primary-light' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      {plan.popular && (
                        <Badge className="absolute -top-2 -right-2 bg-warning text-warning-foreground">
                          Popular
                        </Badge>
                      )}
                      <div className="text-center">
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        <p className="text-2xl font-bold text-primary mt-2">{plan.price}</p>
                        <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Identificação Básica */}
            <Card className="card-emergency">
              <CardHeader className="bg-gradient-to-r from-secondary-light to-secondary-light/50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <User className="w-5 h-5" />
                  Identificação Básica
                </CardTitle>
                <CardDescription className="text-slate-700">
                  Informações pessoais essenciais
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input 
                      id="nome"
                      value={formData.nomeCompleto}
                      onChange={(e) => updateFormData('nomeCompleto', e.target.value)}
                      placeholder="Seu nome completo"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="idade">Idade *</Label>
                    <Input 
                      id="idade"
                      type="number"
                      value={formData.idade}
                      onChange={(e) => updateFormData('idade', e.target.value)}
                      placeholder="32"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input 
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => updateFormData('telefone', e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input 
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      placeholder="seu@email.com"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações Médicas */}
            <Card className="card-emergency">
              <CardHeader className="bg-gradient-to-r from-primary-light to-primary-light/50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-slate-900 text-lg font-medium">
                  <Heart className="w-5 h-5" />
                  Informações Médicas Críticas
                </CardTitle>
                <CardDescription className="text-slate-700">
                  Dados essenciais para emergências médicas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipoSanguineo">Tipo Sanguíneo *</Label>
                    <Select 
                      value={formData.tipoSanguineo} 
                      onValueChange={(value) => updateFormData('tipoSanguineo', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione o tipo sanguíneo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="planoSaude">Plano de Saúde</Label>
                    <Input 
                      id="planoSaude"
                      value={formData.planoSaude}
                      onChange={(e) => updateFormData('planoSaude', e.target.value)}
                      placeholder="Nome do plano e número da carteirinha"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="alergias">Alergias</Label>
                  <Textarea 
                    id="alergias"
                    value={formData.alergias}
                    onChange={(e) => updateFormData('alergias', e.target.value)}
                    placeholder="Liste todas as alergias conhecidas"
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="medicamentos">Medicamentos de Uso Contínuo</Label>
                  <Textarea 
                    id="medicamentos"
                    value={formData.medicamentos}
                    onChange={(e) => updateFormData('medicamentos', e.target.value)}
                    placeholder="Liste medicamentos que você usa regularmente"
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="condicoesMedicas">Condições Médicas</Label>
                  <Textarea 
                    id="condicoesMedicas"
                    value={formData.condicoesMedicas}
                    onChange={(e) => updateFormData('condicoesMedicas', e.target.value)}
                    placeholder="Diabetes, hipertensão, epilepsia, problemas cardíacos, etc."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="hospitalPreferencia">Hospital de Preferência</Label>
                  <Input 
                    id="hospitalPreferencia"
                    value={formData.hospitalPreferencia}
                    onChange={(e) => updateFormData('hospitalPreferencia', e.target.value)}
                    placeholder="Hospital preferido para atendimento"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contatos de Emergência */}
            <Card className="card-emergency">
              <CardHeader className="bg-gradient-to-r from-success-light to-success-light/50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Phone className="w-5 h-5" />
                  Contatos de Emergência
                </CardTitle>
                <CardDescription className="text-slate-700">
                  Pessoas para contatar em caso de emergência
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Contato Primário */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-primary" />
                    Contato Primário *
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="contatoPrimarioNome">Nome *</Label>
                      <Input 
                        id="contatoPrimarioNome"
                        value={formData.contatoPrimarioNome}
                        onChange={(e) => updateFormData('contatoPrimarioNome', e.target.value)}
                        placeholder="Nome do contato"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contatoPrimarioTelefone">Telefone *</Label>
                      <Input 
                        id="contatoPrimarioTelefone"
                        value={formData.contatoPrimarioTelefone}
                        onChange={(e) => updateFormData('contatoPrimarioTelefone', e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contatoPrimarioRelacao">Relação</Label>
                      <Select 
                        value={formData.contatoPrimarioRelacao} 
                        onValueChange={(value) => updateFormData('contatoPrimarioRelacao', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione a relação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="esposa">Esposa</SelectItem>
                          <SelectItem value="marido">Marido</SelectItem>
                          <SelectItem value="mae">Mãe</SelectItem>
                          <SelectItem value="pai">Pai</SelectItem>
                          <SelectItem value="filho">Filho(a)</SelectItem>
                          <SelectItem value="irmao">Irmão(ã)</SelectItem>
                          <SelectItem value="amigo">Amigo(a)</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contato Secundário */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-secondary" />
                    Contato Secundário (Opcional)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="contatoSecundarioNome">Nome</Label>
                      <Input 
                        id="contatoSecundarioNome"
                        value={formData.contatoSecundarioNome}
                        onChange={(e) => updateFormData('contatoSecundarioNome', e.target.value)}
                        placeholder="Nome do contato"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contatoSecundarioTelefone">Telefone</Label>
                      <Input 
                        id="contatoSecundarioTelefone"
                        value={formData.contatoSecundarioTelefone}
                        onChange={(e) => updateFormData('contatoSecundarioTelefone', e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contatoSecundarioRelacao">Relação</Label>
                      <Select 
                        value={formData.contatoSecundarioRelacao} 
                        onValueChange={(value) => updateFormData('contatoSecundarioRelacao', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione a relação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="esposa">Esposa</SelectItem>
                          <SelectItem value="marido">Marido</SelectItem>
                          <SelectItem value="mae">Mãe</SelectItem>
                          <SelectItem value="pai">Pai</SelectItem>
                          <SelectItem value="filho">Filho(a)</SelectItem>
                          <SelectItem value="irmao">Irmão(ã)</SelectItem>
                          <SelectItem value="amigo">Amigo(a)</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="bg-primary-light border border-primary/20 rounded-lg p-6">
              <Button 
                size="lg" 
                className="w-full btn-emergency py-4 text-lg"
                disabled={!isFormValid || isSubmitting}
                onClick={() => setShowConfirmModal(true)}
              >
                {isSubmitting ? 'Processando...' : (
                  isFormValid ? (
                    <>
                      <CreditCard className="mr-2 w-5 h-5" />
                      Finalizar e Pagar {selectedPlan === 'basic' ? 'R$ 55,00' : 'R$ 85,00'}
                    </>
                  ) : 'Preencha os campos obrigatórios'
                )}
              </Button>
              {!isFormValid && (
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  * Campos obrigatórios: Nome, Idade, Telefone, Email, Tipo Sanguíneo e Contato Primário
                </p>
              )}
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <QRCodePreview 
              qrCodeUrl={qrCodeUrl} 
              formData={formData} 
              selectedPlan={selectedPlan} 
            />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmPayment}
        formData={{
          name: formData.nomeCompleto,
          phone: formData.telefone,
          email: formData.email,
          age: parseInt(formData.idade) || 0,
          bloodType: formData.tipoSanguineo || undefined,
          allergies: formData.alergias ? [formData.alergias] : undefined,
          medications: formData.medicamentos ? [formData.medicamentos] : undefined,
          medicalConditions: formData.condicoesMedicas ? [formData.condicoesMedicas] : undefined,
          emergencyContacts: formData.contatoPrimarioNome ? [{
            name: formData.contatoPrimarioNome,
            phone: formData.contatoPrimarioTelefone,
            relationship: formData.contatoPrimarioRelacao || 'Não informado'
          }] : undefined,
          selectedPlan
        }}
        isLoading={isSubmitting}
      />

      {/* MercadoPago Checkout */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Pagamento</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCheckout(false)}
              >
                ✕
              </Button>
            </div>
            <MercadoPagoCheckout
              userData={{
                name: formData.nomeCompleto,
                email: formData.email,
                phone: formData.telefone,
                age: parseInt(formData.idade) || 0,
                bloodType: formData.tipoSanguineo,
                allergies: formData.alergias ? [formData.alergias] : [],
                medications: formData.medicamentos ? [formData.medicamentos] : [],
                medicalConditions: formData.condicoesMedicas ? [formData.condicoesMedicas] : [],
                healthPlan: formData.planoSaude,
                preferredHospital: formData.hospitalPreferencia,
                medicalNotes: formData.observacoesMedicas,
                emergencyContacts: formData.contatoPrimarioNome ? [{
                  name: formData.contatoPrimarioNome,
                  phone: formData.contatoPrimarioTelefone,
                  relationship: formData.contatoPrimarioRelacao || 'Não informado',
                  isMain: true,
                }] : [],
              }}
              planType={selectedPlan}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProfile;