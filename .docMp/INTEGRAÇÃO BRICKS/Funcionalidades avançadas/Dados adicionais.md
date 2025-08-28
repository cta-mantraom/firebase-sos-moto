Dados adicionais
Dentro do callback onSubmit existe um segundo parâmetro, de uso opcional, chamado additionalData. Ele é um objeto e pode conter dados adicionais úteis para sua integração, mas que não são necessários para a confirmação do pagamento no backend.

Veja na tabela a seguir os campos contidos dentro do objeto additionalData, estes que só serão retornados caso o usuário tenha optado pelo pagamento com cartão.

Campo	Tipo	Descrição
bin	string	BIN do cartão inserido pelo usuário.
lastFourDigits	string	Os últimos quatro dígitos para compras com cartão.
cardholderName	string	Nome da pessoa titular do cartão.
Veja abaixo um exemplo de uso:

<Payment
 initialization={initialization}
 customization={customization}
 onSubmit={async ({ selectedPaymentMethod, formData }, additionalData) => {
   console.log({ selectedPaymentMethod, formData }, additionalData);
 }}
/>
Caso não esteja utilizando o botão nativo de enviar formulário do Brick, você também pode acessar o objeto additionalData através do método getAdditionalData. Veja um exemplo de uso a seguir.

// variável onde o controller do Brick está salvo
paymentBrickController.getAdditionalData()
        .then((additionalData) => {
            console.log("Additional data:", additionalData);
        })
        .catch((error) => console.error(error));
Atenção
Chame o método getAdditionalData somente após o envio do formulário, ou seja, após você chamar o método getFormData. Com isso, é garantido que os dados retornados são válidos e confiáveis.