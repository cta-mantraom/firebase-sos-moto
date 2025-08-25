import React from 'react';
import { AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export interface PixData {
  qrCode: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  amount: number;
  instructions?: string[];
}

interface PaymentStatusProps {
  status: string;
  message: string;
  progress: number;
  pixData?: PixData;
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({
  status,
  message,
  progress,
  pixData
}) => {
  // PIX QR Code Display
  if (status === 'pending_pix' && pixData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
          <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
            Pague com PIX
          </h2>
          
          <div className="flex justify-center mb-4">
            {pixData.qrCodeBase64 ? (
              <img 
                src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                alt="QR Code PIX"
                className="w-64 h-64 border-2 border-gray-200 rounded-lg"
              />
            ) : pixData.qrCode ? (
              <div className="w-64 h-64 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center p-4">
                <span className="text-xs text-center font-mono break-all">
                  {pixData.qrCode}
                </span>
              </div>
            ) : (
              <div className="w-64 h-64 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
          
          {/* Instruções PIX */}
          {pixData.instructions && pixData.instructions.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-sm text-blue-900 mb-2">Como pagar:</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                {pixData.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="font-bold mr-2">{index + 1}.</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          
          {/* Valor e Status */}
          <div className="mt-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              R$ {pixData.amount.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-2 animate-pulse">
              Aguardando confirmação do pagamento...
            </p>
            
            {/* Botão para copiar código PIX se disponível */}
            {pixData.qrCode && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pixData.qrCode);
                  alert('Código PIX copiado!');
                }}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                Copiar código PIX
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Status de processamento geral
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
        <div className="flex flex-col items-center">
          {/* Ícone baseado no status */}
          {status === 'pending' || status === 'processing' ? (
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
          ) : status === 'approved' ? (
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          ) : status === 'rejected' || status === 'cancelled' ? (
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
          ) : status === 'timeout' ? (
            <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
          ) : (
            <AlertCircle className="w-16 h-16 text-gray-500 mb-4" />
          )}
          
          {/* Mensagem principal */}
          <h3 className="text-xl font-semibold mb-2 text-center text-gray-800">
            {message}
          </h3>
          
          {/* Barra de progresso */}
          {(status === 'pending' || status === 'processing') && (
            <div className="w-full mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                {progress}% concluído
              </p>
            </div>
          )}
          
          {/* Mensagem adicional baseada no status */}
          <div className="mt-4 text-center">
            {status === 'pending' && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Não feche esta janela.</span>
                <br />
                Estamos processando seu pagamento com segurança.
              </p>
            )}
            
            {status === 'processing' && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-green-600">Pagamento aprovado!</span>
                <br />
                Criando seu perfil de emergência médica...
              </p>
            )}
            
            {status === 'approved' && (
              <p className="text-sm text-green-600 font-semibold">
                Tudo pronto! Você será redirecionado em instantes...
              </p>
            )}
            
            {status === 'rejected' && (
              <div className="text-sm text-red-600">
                <p className="font-semibold mb-2">Pagamento não aprovado</p>
                <p className="text-xs text-gray-600">
                  Verifique os dados do cartão e tente novamente.
                </p>
              </div>
            )}
            
            {status === 'cancelled' && (
              <div className="text-sm text-gray-600">
                <p className="font-semibold mb-2">Pagamento cancelado</p>
                <p className="text-xs">
                  Você cancelou o processo de pagamento.
                </p>
              </div>
            )}
            
            {status === 'timeout' && (
              <div className="text-sm text-yellow-600">
                <p className="font-semibold mb-2">Tempo limite excedido</p>
                <p className="text-xs text-gray-600">
                  O pagamento está demorando mais que o esperado.
                  <br />
                  Verifique com seu banco ou tente novamente.
                </p>
              </div>
            )}
          </div>
          
          {/* Informação de segurança */}
          {(status === 'pending' || status === 'processing') && (
            <div className="mt-6 pt-4 border-t border-gray-200 w-full">
              <div className="flex items-center justify-center text-xs text-gray-500">
                <svg 
                  className="w-4 h-4 mr-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                  />
                </svg>
                Pagamento seguro via MercadoPago
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};