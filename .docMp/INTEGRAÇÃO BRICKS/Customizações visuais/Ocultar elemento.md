Ocultar elemento
Veja abaixo como ocultar elementos do Payment Brick.

Ocultar título
Client-Side

-	Brick
Momento de customização	Ao renderizar Brick
Propriedade	customization.hideFormTitle
Tipo	Boolean
Observações	Quando true, oculta a linha de título.
const customization = {
 visual: {
   hideFormTitle: true
 }
};
Ocultar botão de pagamento
Client-Side

-	Brick
Momento de customização	Ao renderizar Brick
Propriedade	customization.visual.hidePaymentButton
Tipo	Boolean
Observações	Quando true não mostra o botão de enviar o formulário e passa a ser necessário utilizar a função getFormData para obter os dados do formulário (veja exemplo abaixo).
const customization = {
 visual: {
   hidePaymentButton: true
 }
};
Visto que o botão de pagamento padrão foi oculto, será necessário adicionar alguma substituição. Os blocos de código a seguir exemplificam como implementar seu botão de pagamento customizado.

<button type="button" onclick="createPayment();">Custom Payment Button</button>
function createPayment(){
    window.paymentBrickController.getFormData()
        .then(({ formData }) => {
            console.log('formData received, creating payment...');
            fetch("/process_payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })
        })
        .catch((error) => {
            // tratamento de erros ao chamar getFormData()
        });
};