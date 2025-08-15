Meio de pagamento padrão
É possível inicializar o Payment Brick com uma opção de pagamento já aberta. Para configurar um meio de pagamento padrão, utilize a configuração abaixo.

const customization = {
 visual: {
   defaultPaymentOption: {
     walletForm: true,
     // creditCardForm: true,
     // debitCardForm: true,
     // savedCardForm: 'card id sent in the initialization',
     // ticketForm: true,
   },
 }
};
Atenção
Não é possível habilitar mais de um meio de pagamento padrão, então utilize apenas uma propriedade dentro do objeto defaultPaymentOption.