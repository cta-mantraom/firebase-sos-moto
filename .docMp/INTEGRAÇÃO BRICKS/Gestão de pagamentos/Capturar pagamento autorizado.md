Capture pagamento autorizado
A finalização de um pagamento acontece após a captura do pagamento autorizado, o que significa que o valor reservado para a compra pode ser debitado do cartão.

Existem duas formas de capturar um pagamento autorizado:

Captura do valor total de uma reserva: na qual se captura o valor integral do pagamento reservado.
Captura de um valor inferior ao reservado: na qual se captura o valor parcial do pagamento reservado.
Importante
O prazo para capturar o pagamento autorizado é de 5 dias a partir da sua criação.
Abaixo descrevemos o detalhe de cada uma das opções e como executá-las.

Capturar valor total
Para fazer a captura do valor total de uma reserva, envie o valor que deve ser capturado ao parâmetro transaction_amount e execute a requição através dos códigos disponíveis abaixo.

use MercadoPago\Client\Payment\PaymentClient;

  MercadoPagoConfig::setAccessToken("YOUR_ACCESS_TOKEN");

  $client = new PaymentClient();
  $request_options = new RequestOptions();
  $request_options->setCustomHeaders(["X-Idempotency-Key: <SOME_UNIQUE_VALUE>"]);

  $client->capture($payment_id, $request_options);
?>
A resposta devolverá que o pagamento se encontra aprovado e creditado.

{
  ...
  "status": "approved",
  "status_detail": "accredited",
  ...
  "captured": true,
  ...
}
Capturar valor parcial
Para capturar um valor inferior ao reservado, envie o valor que deve ser capturado ao parâmetro transaction_amount e execute a requição através dos códigos disponíveis abaixo.

<?php

  MercadoPago\SDK::setAccessToken("ENV_ACCESS_TOKEN");

  $payment = MercadoPago\Payment::find_by_id($payment_id);
  $payment->transaction_amount = 75;
  $payment->capture = true;
  $payment->update();
?>
A resposta trará o seguinte resultado:

{
  ...
  "status": "approved",
  "status_detail": "accredited",
  ...
  "transaction_amount": 75,
  ...
  "captured": true,
  ...
}
Importante
Não é possível capturar um valor superior ao reservado, para isso é preciso cancelar a reserva e gerar uma nova.