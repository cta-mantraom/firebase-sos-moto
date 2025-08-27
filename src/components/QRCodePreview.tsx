import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, Heart, Phone, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { FormData } from '@/types';

interface QRCodePreviewProps {
  qrCodeUrl: string;
  formData: FormData;
  selectedPlan: 'basic' | 'premium';
}

export const QRCodePreview: React.FC<QRCodePreviewProps> = ({
  qrCodeUrl,
  formData,
  selectedPlan
}) => {
  // QR Code generation now handled by qrcode.react component

  return (
    <div className="space-y-6">
      {/* QR Code Preview */}
      <Card className="card-emergency">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Preview do QR Code SOS
          </CardTitle>
          <CardDescription className="text-slate-300">
            Visualização em tempo real das suas informações
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center">
          {formData.nomeCompleto ? (
            <div className="space-y-4">
              <div className="w-48 h-48 mx-auto bg-white border-2 border-primary/20 rounded-lg flex items-center justify-center p-4">
                <QRCodeSVG 
                  value={qrCodeUrl}
                  size={160}
                  level="M"
                  includeMargin={true}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                QR Code com todas suas informações
              </p>
              <p className="text-xs text-muted-foreground">
                Este será o URL: <br />
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  {qrCodeUrl}
                </code>
              </p>
            </div>
          ) : (
            <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Preencha os dados para ver o preview</p>
                <p className="text-xs">Suas informações aparecerão aqui conforme você preenche o formulário</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview of Emergency Information */}
      {formData.nomeCompleto && (
        <Card className="card-emergency">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  EMERGÊNCIA MÉDICA
                </CardTitle>
                <CardDescription className="text-red-100">
                  ATIVO - {selectedPlan === 'premium' ? 'Premium' : 'Básico'}
                </CardDescription>
              </div>
              <Badge className="bg-white/20 text-white">
                ATIVO
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Identificação */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Identificação
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-blue-700">Nome:</span>
                  <p className="font-medium text-slate-900">{formData.nomeCompleto}</p>
                </div>
                <div>
                  <span className="text-blue-700">Idade:</span>
                  <p className="font-medium text-slate-900">{formData.idade} anos</p>
                </div>
              </div>
            </div>

            {/* Informações Médicas Críticas */}
            {formData.tipoSanguineo && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Informações Médicas Críticas
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-red-700 font-medium">Tipo Sanguíneo:</span>
                    <Badge className="ml-2 bg-red-600 text-white">
                      {formData.tipoSanguineo}
                    </Badge>
                  </div>
                  {formData.planoSaude && (
                    <div>
                      <span className="text-red-700">Plano de Saúde:</span>
                      <p className="text-slate-900">{formData.planoSaude}</p>
                    </div>
                  )}
                  {formData.alergias && (
                    <div>
                      <span className="text-red-700">Alergias:</span>
                      <p className="text-slate-900">{formData.alergias}</p>
                    </div>
                  )}
                  {formData.medicamentos && (
                    <div>
                      <span className="text-red-700">Medicamentos:</span>
                      <p className="text-slate-900">{formData.medicamentos}</p>
                    </div>
                  )}
                  {formData.condicoesMedicas && (
                    <div>
                      <span className="text-red-700">Condições Médicas:</span>
                      <p className="text-slate-900">{formData.condicoesMedicas}</p>
                    </div>
                  )}
                  {formData.hospitalPreferencia && (
                    <div>
                      <span className="text-red-700">Hospital Preferido:</span>
                      <p className="text-slate-900">{formData.hospitalPreferencia}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contatos de Emergência */}
            {formData.contatoPrimarioNome && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contatos de Emergência
                </h4>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border border-green-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-green-700 font-medium">Contato Principal</span>
                      <Badge className="bg-green-600 text-white text-xs">
                        {formData.contatoPrimarioRelacao || 'Não informado'}
                      </Badge>
                    </div>
                    <p className="font-medium text-slate-900">{formData.contatoPrimarioNome}</p>
                    <p className="text-sm text-slate-600">{formData.contatoPrimarioTelefone}</p>
                  </div>
                  
                  {formData.contatoSecundarioNome && (
                    <div className="bg-white p-3 rounded border border-green-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-green-700 font-medium">Contato Secundário</span>
                        <Badge className="bg-green-600 text-white text-xs">
                          {formData.contatoSecundarioRelacao || 'Não informado'}
                        </Badge>
                      </div>
                      <p className="font-medium text-slate-900">{formData.contatoSecundarioNome}</p>
                      <p className="text-sm text-slate-600">{formData.contatoSecundarioTelefone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Acesso 24/7 */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-slate-700">
                <Clock className="w-4 h-4 text-success" />
                <span className="text-sm font-medium">Acesso 24/7</span>
                <CheckCircle className="w-4 h-4 text-success" />
              </div>
              <p className="text-center text-xs text-slate-600 mt-2">
                Estas informações estarão disponíveis 24 horas por dia para profissionais de saúde em emergências.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};