import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, CreditCard, Shield, AlertTriangle, Heart, Phone } from 'lucide-react';
import { CheckoutData } from '@/types';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formData: CheckoutData;
  isLoading: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  formData,
  isLoading
}) => {
  const planDetails = {
    basic: {
      name: 'Plano Básico',
      price: 'R$ 55,00',
      features: [
        'QR Code digital personalizado',
        '3 alterações por ano',
        'Validade de 3 anos',
        'Acesso 24/7 às informações',
        'Suporte via email'
      ]
    },
    premium: {
      name: 'Plano Premium',
      price: 'R$ 85,00',
      features: [
        'QR Code digital personalizado',
        'Cartão físico enviado pelos Correios',
        '3 alterações por ano',
        'Validade de 2 anos',
        'Acesso 24/7 às informações',
        'Suporte prioritário'
      ]
    }
  };

  const plan = planDetails[formData.selectedPlan];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Confirmar Dados e Finalizar Pagamento
          </DialogTitle>
          <DialogDescription>
            Revise suas informações antes de prosseguir com o pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plano Selecionado */}
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <p className="text-2xl font-bold text-primary">{plan.price}</p>
                  <p className="text-sm text-muted-foreground">Pagamento único</p>
                </div>
                <Badge className="bg-primary text-primary-foreground">
                  Selecionado
                </Badge>
              </div>
              
              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dados Pessoais */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Dados Pessoais
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Nome:</span>
                <p className="font-medium">{formData.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Idade:</span>
                <p className="font-medium">{formData.age} anos</p>
              </div>
              <div>
                <span className="text-muted-foreground">Telefone:</span>
                <p className="font-medium">{formData.phone}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{formData.email}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Informações Médicas */}
          {formData.bloodType && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Informações Médicas
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo Sanguíneo:</span>
                  <Badge className="ml-2 bg-red-600 text-white">
                    {formData.bloodType}
                  </Badge>
                </div>
                {formData.allergies && formData.allergies.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Alergias:</span>
                    <p className="font-medium">{formData.allergies.join(', ')}</p>
                  </div>
                )}
                {formData.medications && formData.medications.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Medicamentos:</span>
                    <p className="font-medium">{formData.medications.join(', ')}</p>
                  </div>
                )}
                {formData.medicalConditions && formData.medicalConditions.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Condições Médicas:</span>
                    <p className="font-medium">{formData.medicalConditions.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contatos de Emergência */}
          {formData.emergencyContacts && formData.emergencyContacts.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  Contatos de Emergência
                </h4>
                <div className="space-y-3">
                  {formData.emergencyContacts.map((contact, index) => (
                    <div key={index} className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{contact.name}</span>
                        <Badge variant="outline">{contact.relationship}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{contact.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Revisar Dados
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 btn-emergency"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pagar {plan.price}
                </>
              )}
            </Button>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Pagamento 100% seguro via Mercado Pago</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};