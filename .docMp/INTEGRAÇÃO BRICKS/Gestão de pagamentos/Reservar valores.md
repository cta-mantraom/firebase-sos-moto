Reservar valores
Uma reserva de valores acontece quando uma compra é realizada e seu montante é reservado do limite total do cartão, garantindo que o valor fique guardado até a conclusão do processamento.

Para realizar uma autorização de reserva de valores, envie um POST com com todos os atributos necessários e adicione o atributo capture=false ao endpoint /v1/payments e execute a requisição ou, se preferir, utilize um dos SDKs abaixo.

<?php
  use MercadoPago\Client\Payment\PaymentClient;


  MercadoPagoConfig::setAccessToken("YOUR_ACCESS_TOKEN");

  $client = new PaymentClient();
  $request_options = new RequestOptions();
  $request_options->setCustomHeaders(["X-Idempotency-Key: <SOME_UNIQUE_VALUE>"]);

  $payment = $client->create([
    "transaction_amount" => 100,
    "token" => "123456",
    "description" => "My product",
    "installments" => 1,
    "payment_method_id" => "visa",
    "payer" => [
      "email" => "my.user@example.com",
    ],
    "capture" => false
  ], $request_options);
  echo implode($payment);
?>
A resposta indica que o pagamento se encontra autorizado e pendente de captura.

{
  "id": PAYMENT_ID,
  ...
  "status": "authorized",
  "status_detail": "pending_capture",
  ...
  "captured": false,
  ...
}
Além disso, também é possível retornar como rejeitado ou pendente. Tenha em conta que os valores autorizados não poderão ser utilizados pelo seu cliente até que não sejam capturados. Recomendamos realizar a captura o quanto antes.

Importante
A reserva terá validade de 5 dias. Se não capturá-la nesse período, será cancelada. Além disso, é necessário guardar o ID do pagamento para poder finalizar o processo.