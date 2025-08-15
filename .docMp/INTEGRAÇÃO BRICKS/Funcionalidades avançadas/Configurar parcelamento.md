Configurar parcelamento
Client-Side

Brick	Payment Brick
Momento da customização	Ao renderizar Brick.
Propriedade	customization.paymentMethods.minInstallments && customization.paymentMethods.maxInstallments
Tipo	number
Observações	Quando é passado um valor para min ou maxInstallments, o número de parcelas será restringido pelos valores passados.
const customization = {
  paymentMethods: {
   minInstallments: number,
   maxInstallments: number,
 },
};