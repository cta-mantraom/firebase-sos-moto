Cartões
Server-Side

Com todas as informações coletadas no backend , envie um POST com os atributos necessários ao endpoint /v1/payments e execute a requisição ou, se preferir, faça o envio das informações utilizando nossos SDKs.

Importante
Além disso, você deverá enviar obrigatoriamente o atributo X-Idempotency-Key. Seu preenchimento é importante para garantir a execução e reexecução de requisições de forma segura, sem o risco de realizar a mesma ação mais de uma vez por engano. Para fazé-lo, atualize nossa biblioteca de SDK ou gere um UUID V4 e envie-o no header de suas chamadas.

Resposta
{
    "status": "approved",
    "status_detail": "accredited",
    "id": 3055677,
    "date_approved": "2019-02-23T00:01:10.000-04:00",
    "payer": {
        ...
    },
    "payment_method_id": "visa",
    "payment_type_id": "credit_card",
    "refunds": [],
    ...
}
O callback de onSubmit do Brick contém todos os dados necessários para a criação de um pagamento, porém, caso deseje, é possível incluir detalhes adicionais, o que pode facilitar o reconhecimento da compra por parte do comprador e aumentar a taxa de aprovação dos pagamentos.

Para fazer isso, adicione campos relevantes ao objeto enviado, que vem na resposta do callback onSubmit do Brick. Alguns desses campos são: description (esse campo pode ser exibido nos boletos emitidos) e external_reference (id da compra no seu site, que permite o reconhecimento da compra mais fácil). Também é possível adicionar dados complementares sobre o comprado