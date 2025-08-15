Inicializar dados nos Bricks
Client-Side

Cartões
No formulário exibido para pagamento com cartões, é possível inicializar com os campos de documento e e-mail já preenchidos. Para isso, é necessário passar a seguinte configuração no objeto de inicialização do Brick.

const initialization = {
 ...,
 payer: {
   ...,
   email: '<PAYER_EMAIL_HERE>',
   identification: {
     type: 'string',
     number: 'string',
   },
 },
};
Pix
No formulário exibido para pagamento com Pix, é possível inicializar com o campo de e-mail já preenchido. Para isso, é necessário passar a seguinte configuração no objeto de inicialização do Brick.

const initialization = {
 ...,
 payer: {
   ...,
   email: '<PAYER_EMAIL_HERE>',
 },
};