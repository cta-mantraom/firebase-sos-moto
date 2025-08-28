Obter pagamento
GET

https://api.mercadopago.com/v1/payments/{id}
Consulte todas as informações de um pagamento através do ID de pagamento.
Produtos relacionados:
Parâmetros de requisição
PATH

Obrigatório

Opcional
id
number
OBRIGATÓRIO

Identificador único de pagamento, gerado automaticamente pelo Mercado Pago.
Inserir valor
Parâmetros de resposta
id
number
Identificador único de pagamento, gerado automaticamente pelo Mercado Pago.
date_created
string
Data de criação do pagamento.
date_approved
string
Data de aprovação do pagamento. Um pagamento pode ser gerado em um estado intermediário e depois aprovado, portanto, a data de criação nem sempre coincidirá com a data de aprovação.
date_last_updated
string
Data em que o último evento de pagamento foi registrado.
date_of_expiration
string
Data de expiração do pagamento. O formato do atributo é o seguinte - "yyyy-MM-dd'T'HH:mm:ssz". Ex. - 2022-11-17T09:37:52.000-04:00.
money_release_date
string
Data em que o pagamento é liquidado e o dinheiro é disponibilizado na conta Mercado Pago do Collector (aquele que recebe o pagamento). O campo pode assumir os valores “pending” ou “released”, sendo que o primeiro indica ...Ver mais
operation_type
string
Indica o tipo de pagamento. Os tipos disponíveis são os seguintes.
investment: Quando os fundos são investidos em produtos como CDB no aplicativo do Mercado Pago;
regular_payment: Classificação padrão para uma compra paga através do Mercado Pago.
money_transfer: Transferência de fundos entre dois usuários.
Ver mais
issuer_id
string
Identificador do emissor do cartão que está sendo utilizado em um pagamento com cartão de crédito ou débito.
payment_method
object
Informação sobre o meio de pagamento. Utilize o endpoint '/v1/payment_methods' para acessar a lista completa de meios de pagamento disponíveis. Esse recurso fornece detalhes sobre cada meio, incluindo suas propriedades.

Mostrar atributos
payment_method_id
string
Indica o identificador do meio de pagamento selecionado para efetuar o pagamento. A seguir, apresentamos alguns exemplos. Obtenha todos os meios de pagamento disponíveis consultando a API de 'Obter meios de pagamento'.
Pix: Método de pagamento digital instantâneo utilizado no Brasil.
Debin_transfer: Método de pagamento digital utilizado na Argentina que debita imediatamente um valor da conta, solicitando autorização prévia.
Ted: É o pagamento por Transferência Eletrônica Disponível, usado no Brasil, que possui taxas de utilização. O pagamento é realizado no mesmo dia da transação, mas, para isso, é necessário realizar a transferência dentro do período estipulado.
Ver mais
payment_type_id
string
É o tipo da forma de pagamento (cartão, transferência bancária, boleto, caixa eletrônico, etc). Podem ser dos seguintes tipos.
ticket: Boleto, Pagamento em Caixa Eletrônica, PayCash, Efecty, Oxxo, etc.
bank_transfer: Pix e PSE (Pagos Seguros en Línea).
atm: Pagamento em caixa eletrônico (amplamente utilizado no México através do BBVA Bancomer).
Ver mais
status
string
É o estado atual do pagamento. Podem ser ser dos seguintes tipos.
pending: O usuário ainda não concluiu o processo de pagamento (por exemplo, após gerar um boleto, o pagamento será concluído quando o usuário pagar no local selecionado).
approved: O pagamento foi aprovado e creditado com sucesso.
authorized: O pagamento foi autorizado, mas ainda não foi capturado.
Ver mais
status_detail
string
Detalhe no qual resultou a Coleção.
accredited: Pagamento creditado.
partially_refunded: O pagamento foi feito com pelo menos um reembolso parcial.
partially_bpp_refunded: A mediação foi favorável ao pagador e o pagamento parcialmente devolvido.
Ver mais
currency_id
string
Identificador da moeda utilizada no pagamento. Atualmente, possuímos as opções a seguir.
ARS: Peso argentino.
BRL: Real brasileiro.
CLP: Peso chileno.
Ver mais
description
string
Descrição do produto comprado, a razão de pagamento. Ex. - "Celular Xiaomi Redmi Note 11S 128gb 6gb Ram Versão Global Original azul" (descrição de um produto no marketplace).
live_mode
boolean
Indica se o pagamento foi feito em ambiente de produção ou em ambiente de teste. Se TRUE, o estorno será processado em modo de produção. Se FALSE, o estorno será processado no modo sandbox.
sponsor_id
string
Este campo foi descontinuado e não é mais utilizado.
authorization_code
string
Código de autorização de transação para pagamentos com “payment_method_type” do tipo “credit_card” (cartão de crédito), “debit_card” (cartão de débito) e “voucher_card” (cartão de voucher para benefícios, como Alelo). Em...Ver mais
money_release_schema
string
Esse campo é usado para identificar se um pagamento é PNF (pagamento no fluxo). Pagamento no fluxo é uma forma de liberação de dinheiro em que as parcelas recebidas por um vendedor são liberadas com o passar dos meses (q...Ver mais
counter_currency
string
Basicamente, é um objeto que permitirá converter em dólares pagamentos do tipo CBT (Cross Border Trade), que são pagamentos internacionais, feitos em moeda estrangeira.
collector_id
string
É o usuário que recebe o dinheiro. Por exemplo - Um usuário (payer) compra um celular pelo marketplace. O identificador da loja/vendedor a receber o pagamento é o collector_id.
payer
object
Dados do pagador - ID (número de identificação), e-mail, identificação (tipo e número de documento)

Mostrar atributos
metadata
object
Este é um objeto opcional do tipo chave-valor no qual o cliente pode adicionar informações adicionais que precisam ser registradas no pagamento. Por exemplo - {"payments_group_size":1,"payments_group_timestamp":"2022-11-...Ver mais
additional_info
object
No nível de Pagamentos, são apenas dados e nós apenas encaminhamos essas informações para outras APIs, como Risco, para realizar pontuação e prevenir fraudes, para Impostos para determiná-los para pagamentos internaciona...Ver mais
external_reference
string
É uma referência externa do pagamento. Pode ser, por exemplo, um hashcode do Banco Central, funcionando como identificador de origem da transação.
transaction_amount
number
Custo do produto. Exemplo - A venda de um produto por R$100,00 terá um transactionAmount = 100.
transaction_amount_refunded
number
Valor reembolsado da transação
coupon_amount
number
É o valor do cupom de desconto. Ex - R$14,50. O tipo do atributo é BigDecimal.
differential_pricing_id
string
Atributo que comumente contém um acordo de quanto vai ser cobrado do usuário (geralmente, este campo é mais relevante para pagamentos do Marketplace). A precificação e as taxas são calculadas com base nesse identificador...Ver mais
deduction_schema
string
Esquema de Pricing aplicado pelo Mercado Pago. É um campo que representa as informações de um tipo de financiamento (parcelamento). Ex. - “ahora12” é um schema que indica que o pagamento está parcelado em 12 vezes. Em ad...Ver mais
transaction_details
object
Detalhes da transação.

Mostrar atributos
captured
boolean
Indica se o valor do pagamento foi capturado ou está com captura pendente.
binary_mode
boolean
Quando definido como TRUE, os pagamentos só podem ser aprovados ou rejeitados. Caso contrário, eles também podem resultar in_process.
call_for_authorize_id
string
Identificador que é fornecido ao banco emissor para que os pagamentos possam ser autorizados.
statement_descriptor
string
Descrição com a qual o pagamento aparecerá no resumo do cartão (ex. MERCADOPAGO)
installments
number
Número de parcelas selecionado.
card
object
Identificador de cartão.
notification_url
string
URL de notificações disponível para receber notificações de eventos relacionados ao Pagamento. A quantidade máxima de caracteres permitidos para envio neste parâmetro é de 248 caracteres.
processing_mode
string
Modo de processamento. Existem dois tipos:
Aggregator: O merchant utilizará os códigos de merchant do Mercado Pago e aproveitará as vantagens financeiras que oferecemos.
Gateway: O merchant deve ter seu próprio código de merchant para vendas online e acordos com cada método de pagamento desejado.
merchant_account_id
string
Identificador do código da loja comerciante. Aplica-se somente ao modelo gateway (porque a entrega de dinheiro ao comerciante não passa pelo sistema do Mercado Pago).
acquirer
string
Adquirente.
merchant_number
string
Número do estabelecimento (aplica-se ao modelo de gateway).