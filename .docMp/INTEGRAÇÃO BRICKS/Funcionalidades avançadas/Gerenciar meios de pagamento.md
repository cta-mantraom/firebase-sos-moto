Gerenciar meios de pagamento
O Payment Brick permite a integração com múltiplos meios de pagamento e, para isso, ajuste nas customizações do Brick os meios de pagamento aceitos.

Para não incluir o meio de pagamento de um determinado tipo, remova-o do objeto de paymentMethods.
const customization = {
 paymentMethods: {
   ...,
   creditCard: 'all'
 }
};
A tabela abaixo mostra os métodos de pagamento disponíveis:

Todos os tipos de meios de pagamento aceitam a opção all, assim todas as opções disponíveis para aquele tipo serão ativadas.
paymentMethods	Tipo	Valores possíveis
creditCard	string	Para obter os valores de cartões de crédito disponíveis, consulte a API Obter meios de pagamento.
debitCard	string	Para obter os valores de cartões de débito disponíveis, consulte a API Obter meios de pagamento.
prepaidCard	string	Para obter os valores de cartões de crédito disponíveis, consulte a API Obter meios de pagamento.
mercadoPago	string	['onboarding_credits', 'wallet_purchase']
ticket	string	['bolbradesco']
bankTransfer	string	['pix']