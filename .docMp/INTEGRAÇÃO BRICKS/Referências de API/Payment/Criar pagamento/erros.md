Erros
400Erro

1

Params Error. - Caso esse erro apareça, verifique os parâmetros enviados na solicitação.

3

Token must be for test. - Caso esse erro ocorra, certifique-se de que está usando um token de teste.

8

The name of the following parameters is wrong [additional_info.payer.test] - Este erro é exibido quando o nome de determinado parâmetro é inserido incorretamente. Neste exemplo, o campo `additional_info.payer`. Revise o parâmetro retornado no erro e garanta que a informação inserida esteja correta.

23

The following parameters must be valid date and format (yyyy-MM-dd'T'HH:mm:ssz) date_of_expiration. - Se esse erro surgir, certifique-se de que a data de expiração está no formato correto.

1000

Number of rows exceeded the limits. - Se encontrar esse erro, reduza o número de linhas na sua solicitação.

2002

Customer not found. - Verifique os detalhes do cliente e tente novamente se encontrar esse erro.

2004

POST to Gateway Transactions API fail. - Caso esse erro ocorra, verifique o endpoint da API e tente novamente.

2006

Card Token not found. - Caso veja esse erro, certifique-se de que o token do cartão está correto e válido.

2007

Connection to Card Token API fail. - Verifique sua conexão de rede e tente novamente se esse erro aparecer.

2009

Card token issuer can't be null. - Certifique-se de que o emissor do token do cartão seja fornecido se esse erro ocorrer.

2034

Invalid users involved. - Se esse erro aparecer, certifique-se de que os usuários envolvidos são todos produtivos ou todos de teste. Além disso, verifique se o sponsor_id (se aplicável) está correto e tente novamente.

2059

You cannot use `application_fee` with this payment. - Este erro ocorre porque o Access Token que está sendo utilizado não foi obtido através do OAuth. Certifique-se de utilizar um Access Token gerado via OAuth.

2062

Invalid card token. - Certifique-se de que o token do cartão fornecido é válido e correto se esse erro ocorrer.

2067

Invalid user identification number. - Verifique o número de identificação do usuário e tente novamente se encontrar esse erro.

2072

Invalid value for transaction_amount. - Certifique-se de que o transaction_amount seja válido se esse erro aparecer.

2077

Deferred capture not supported. - Se esse erro ocorrer, observe que a captura diferida não é suportada e ajuste sua solicitação conforme necessário.

2123

Invalid operators users involved. - Caso veja esse erro, verifique os operadores envolvidos na transação.

2131

Cannot infer Payment Method. - Verifique se o campo `payment_method` está preenchido corretamente e está de acordo com o meio de pagamento utilizado, assim como o número de parcelas (`installments`).

2198

Invalid test user email. - esse erro ocorre quando o atributo payer.email é enviado usando um e-mail que não é de teste enquanto você está em um ambiente de teste (por exemplo, usando um e-mail @testuser.com). Se você encontrar esse erro, verifique se você está realmente em um ambiente de teste e, se estiver, use um e-mail conforme especificado.

3000

You must provide your cardholder_name with your card data. - Se esse erro ocorrer, inclua o cardholder_name na sua solicitação.

3001

You must provide your cardissuer_id with your card data. - Se encontrar esse erro, certifique-se de que o cardissuer_id está incluído na sua solicitação.

3003

Invalid card_token_id. - Certifique-se de que o card_token_id está correto e não foi utilizado anteriormente. Tente novamente.

3004

Invalid parameter site_id. - Se esse erro ocorrer, certifique-se de que o site_id é válido e está corretamente formatado.

3005

Not valid action, the resource is in a state that does not allow this operation. For more information see the state that has the resource. - Caso veja esse erro, verifique o estado do recurso e ajuste sua solicitação conforme necessário.

3006

Invalid parameter cardtoken_id. - Certifique-se de que o cardtoken_id está correto e tente novamente se esse erro aparecer.

3007

The parameter client_id cannot be null or empty. - Se esse erro ocorrer, forneça um client_id válido.

3008

Not found Cardtoken. - Verifique as informações do cardtoken e tente novamente se esse erro aparecer.

3009

Unauthorized client_id. - Se esse erro ocorrer, verifique as permissões do client_id e tente novamente.

3010

Not found card on whitelist. - Certifique-se de que o cartão está na lista branca se esse erro aparecer.

3011

Not found payment_method. - Verifique as informações do payment_method e tente novamente se esse erro ocorrer.

3012

Invalid parameter security_code_length. - Certifique-se de que o parâmetro security_code_length está correto se esse erro aparecer.

3013

The parameter security_code is a required field and cannot be null or empty. - Se esse erro ocorrer, forneça o parâmetro security_code.

3014

Invalid parameter payment_method. - Certifique-se de que o parâmetro payment_method está correto se esse erro aparecer.

3015

Invalid parameter card_number_length. - Se esse erro ocorrer, certifique-se de que o parâmetro card_number_length está correto.

3016

Invalid parameter card_number. - Verifique o parâmetro card_number e tente novamente se esse erro aparecer.

3017

The parameter card_number_id cannot be null or empty. - Certifique-se de que o parâmetro card_number_id é fornecido se esse erro ocorrer.

3018

The parameter expiration_month cannot be null or empty. - Forneça o parâmetro expiration_month se esse erro ocorrer.

3019

The parameter expiration_year cannot be null or empty. - Certifique-se de que o parâmetro expiration_year é fornecido se esse erro aparecer.

3020

The parameter cardholder.name cannot be null or empty. - Forneça o parâmetro cardholder.name se esse erro ocorrer.

3021

The parameter cardholder.document.number cannot be null or empty. - Certifique-se de que o parâmetro cardholder.document.number é fornecido se esse erro aparecer.

3022

The parameter cardholder.document.type cannot be null or empty. - Forneça o parâmetro cardholder.document.type se esse erro ocorrer.

3023

The parameter cardholder.document.subtype cannot be null or empty. - Certifique-se de que o parâmetro cardholder.document.subtype é fornecido se esse erro aparecer.

3024

Not valid action - partial refund unsupported for this transaction. - Se esse erro ocorrer, observe que reembolsos parciais não são suportados para esta transação.

3025

Invalid Auth Code. - Verifique o código de autenticação e tente novamente se esse erro aparecer.

3026

Invalid card_id for this payment_method_id. - Certifique-se de que o card_id corresponde ao payment_method_id se esse erro ocorrer.

3027

Invalid payment_type_id. - Se esse erro aparecer, verifique o payment_type_id e tente novamente.

3028

Invalid payment_method_id. - Verifique o payment_method_id e tente novamente se esse erro ocorrer.

3029

Invalid card expiration month. - Certifique-se de que o mês de expiração do cartão é válido se esse erro aparecer.

3030

Invalid card expiration year. - Se esse erro ocorrer, verifique o ano de expiração do cartão e tente novamente.

3031

Secure_code_id can't be null. - Certifique-se de que o secure_code_id é fornecido se esse erro aparecer.

3032

Invalid security_code_length 3033 3034 - Invalid card_number_validation. - Se esse erro ocorrer, verifique o comprimento do código de segurança e a validação do número do cartão.

4000

Token attribute can't be null. - Certifique-se de que o atributo token é fornecido se esse erro aparecer.

4001

Payment_method_id attribute can't be null. - Se esse erro ocorrer, forneça o atributo payment_method_id.

4002

Transaction_amount attribute can't be null. - Certifique-se de que o atributo transaction_amount é fornecido se esse erro aparecer.

4003

Transaction_amount attribute must be numeric. - Verifique se o transaction_amount é numérico se esse erro ocorrer.

4004

Installments attribute can't be null. - Se esse erro aparecer, certifique-se de que o atributo installments é fornecido.

4005

Installments attribute must be numeric. - Certifique-se de que o atributo installments é numérico se esse erro ocorrer.

4006

Payer attribute is malformed. - Verifique se o atributo payer está corretamente formatado se esse erro aparecer.

4012

Payer.id attribute can't be null. - Se esse erro aparecer, certifique-se de que o atributo payer.id é fornecido.

4013

Payer.type attribute can't be null. - Certifique-se de que o atributo payer.type é fornecido se esse erro ocorrer.

4015

Payment_method_reference_id attribute can't be null. - Forneça o atributo payment_method_reference_id se esse erro aparecer.

4016

Payment_method_reference_id attribute must be numeric. - Certifique-se de que o atributo payment_method_reference_id é numérico se esse erro ocorrer.

4017

Status attribute can't be null. - Se esse erro aparecer, certifique-se de que o atributo status é fornecido.

4018

Payment_id attribute can't be null. - Forneça o atributo payment_id se esse erro ocorrer.

4019

Payment_id attribute must be numeric. - Certifique-se de que o atributo payment_id é numérico se esse erro aparecer.

4020

Notification_url attribute must be a valid URL. - Se esse erro ocorrer, forneça uma URL válida para o atributo `notification_url` que comece com `https://`.

4021

Notification_url attribute must be shorter than 500 characters. - Certifique-se de que o atributo notification_url está dentro do limite de caracteres se esse erro aparecer.

4022

Metadata attribute must be a valid JSON. - Se esse erro ocorrer, certifique-se de que o atributo metadata é um JSON válido.

4023

Transaction_amount attribute can't be null. - Forneça o atributo transaction_amount se esse erro aparecer.

4024

Transaction_amount attribute must be numeric. - Certifique-se de que o atributo transaction_amount é numérico se esse erro ocorrer.

4025

Refund_id can't be null. - Forneça o refund_id se esse erro aparecer.

4026

Invalid coupon_amount. - Verifique se a quantidade do cupom está correta se esse erro ocorrer.

4027

Campaign_id attribute must be numeric. - Certifique-se de que o atributo campaign_id é numérico se esse erro aparecer.

4028

Coupon_amount attribute must be numeric. - Verifique se o atributo coupon_amount é numérico se esse erro ocorrer.

4029

Invalid payer type. - Certifique-se de que o tipo de pagador é válido se esse erro aparecer.

4033

Invalid installments. - Verifique se o parâmetro de parcelas está correto se esse erro ocorrer.

4037

Invalid transaction_amount. - Certifique-se de que o valor da transação é válido se esse erro aparecer.

4038

Application_fee cannot be bigger than transaction_amount. - Se esse erro ocorrer, certifique-se de que a taxa de aplicação seja menor ou igual ao valor da transação.

4039

Application_fee cannot be a negative value. - Certifique-se de que a taxa de aplicação é um valor positivo se esse erro aparecer.

4050

Payer.email must be a valid email. - Se esse erro ocorrer, certifique-se de que o payer.email é um endereço de email válido.

4051

Payer.email must be shorter than 254 characters. - Certifique-se de que o payer.email está dentro do limite de caracteres se esse erro aparecer.

4292

Header X-Idempotency-Key can’t be null. - Forneça um cabeçalho X-Idempotency-Key válido se esse erro ocorrer.

6033

User unavailable. - Se esse erro aparecer, verifique o status do usuário e tente novamente.

7523

Invalid expiration date. - Certifique-se de que a data de expiração é válida se esse erro ocorrer.

401Erro

Unauthorized use of live credentials

Esse erro ocorre quando o token de acesso não tem o escopo 'payment' necessário. Verifique se as credenciais estão corretas e se possuem as permissões adequadas.

403Erro

4

O caller não está autorizado a acessar este recurso. - Se esse erro ocorrer, verifique suas permissões de acesso.

3002

O caller não está autorizado a realizar esta ação. - Caso veja esse erro, certifique-se de que tem as permissões necessárias para realizar essa ação.

pa_unauthorized_result_from_policies

blocked_by PolicyAgent - At least one policy returned unauthorized - Este erro ocorre quando pelo menos uma política retorna 'unauthorized'. Isso pode acontecer se o header de `authorization` for removido durante a requisição ou se o Access Token não for enviado. Verifique o envio dessas informações e tente fazer uma nova requisição.