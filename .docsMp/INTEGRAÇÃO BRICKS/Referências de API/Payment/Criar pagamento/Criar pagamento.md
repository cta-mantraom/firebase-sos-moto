Criar pagamento
POST

https://api.mercadopago.com/v1/payments
Este endpoint permite a criação de um pagamento, possibilitando a inclusão de todas as informações necessárias. Certifique-se de adicionar os detalhes do pagamento e as informações do cliente. Em caso de sucesso, a requisição retornará uma resposta com o status 201.
Produtos relacionados:

Parâmetros de requisição
HEADER

Obrigatório

Opcional
X-Idempotency-Key
string
OBRIGATÓRIO

Esta função permite repetir solicitações de forma segura, sem o risco de realizar a mesma ação mais de uma vez por engano. Isso é útil para evitar erros, como a criação de dois pagamentos idênticos, por exemplo. Para garantir que cada solicitação seja única, é importante usar um valor exclusivo no header da sua solicitação. Sugerimos o uso de um UUID V4 ou strings randômicas.
0d5020ed-1af6-469c-ae06-c3bec19954bb
BODY

Obrigatório

Opcional
additional_info
object
No nível de Pagamentos, são apenas dados e apenas encaminhamos essas informações para outras APIS, como Risco, para realizar pontuação e prevenir fraudes, para Impostos para determiná-los para pagamentos internacionais.

Mostrar atributos
Atributos de additional_info
ip_address
string
Protocolo interno (IP) que provém do request (apenas para transferência bancária).
items
array
Lista de itens a pagar.

Mostrar atributos
id
string
É o identificador do anúncio do produto comprado. Por exemplo - “MLB2907679857”.
title
string
Título do produto. Para saber como criar um bom título, confira o artigo: https://bit.ly/3X6ytAX
description
string
Descrição do produto.
picture_url
string
URL da imagem.
category_id
string
É a categoria do item que foi comprado. É possível citar duas formas principais de category_id - as categorias inseridas por meio de um código, como “MLB189908”, ou as que são uma tag, como “phone”.
quantity
number
Quantidade do produto. Este parâmetro será retornado como uma String.
unit_price
number
Preço unitário do item comprado. Este parâmetro será retornado como uma String. Para o Chile (MLC) deve ser um número inteiro.
type
string
Tipo de item sendo vendido
event_date
string
Data do Evento - Utilize o formato padrão ISO 8601 para inserir a data e o horário do evento. O formato deve ser "yyyy-MM-ddTHH:mm:ss.sssZ". Por exemplo, para marcar um evento para o dia 31 de dezembro de 2023, às 9:37:5...Ver mais
warranty
boolean
Indica se o produto tem garantia ou não. True se tiver, false se não.
category_descriptor
object

Mostrar atributos
passenger
object

Mostrar atributos
first_name
string
Primeiro nome do passageiro
last_name
string
Sobrenome do passageiro
route
object

Mostrar atributos
departure
string
Cidade de partida
destination
string
Cidade de destino
departure_date_time
string
Data e hora de partida. O formato válido é o seguinte - "yyyy-MM-ddTHH:mm:ss.sssZ". Exemplo - 2023-12-31T09:37:52.000-04:00.
arrival_date_time
string
Data e hora de chegada. O formato válido é o seguinte - "yyyy-MM-ddTHH:mm:ss.sssZ". Exemplo - 2023-12-31T09:37:52.000-04:00.
company
string
Nome da empresa
payer
object
OBRIGATÓRIO

O payer é aquele que faz o pagamento. Este campo é um objeto que possui as informações do pagador.

Mostrar atributos
first_name
string
Nome do comprador.
last_name
string
É o campo do sobrenome do comprador.
phone
object
Telefone do comprador.

Mostrar atributos
area_code
string
Código de área onde reside o comprador.
number
string
Número de telefone do comprador.
address
object
Endereço do comprador.

Mostrar atributos
zip_code
string
Código postal do comprador.
street_name
string
Rua onde mora o comprador.
street_number
number
Número do imóvel onde mora o comprador. Caso não possua um número, enviar "S/N".
neighborhood
number
Nome do bairro onde o comprador mora. Este campo é obrigatório para pagamentos com boleto.
city
number
Cidade de residência do comprador. Este campo é obrigatório para pagamentos com boleto.
federal_unit
number
Unidade federativa (UF) do comprador. Este campo é obrigatório para pagamentos realizados por meio de boleto.
registration_date
string
Data de cadastro do comprador (payer) em seu site. O formato válido do atributo é o seguinte - "yyyy-MM-dd'T'HH:mm:ssz". Ex - 2021-06-15T19:22:41.001-03:00.
is_prime_user
string
Indica se o pagador é um usuário premium. Os valores válidos são os seguintes - "1" se for, "0" se não for.
is_first_purchase_online
string
Indica se o pagador já realizou uma compra em seu site anteriormente. Os valores válidos são os seguintes - "1" se for, "0" se não for.
last_purchase
string
Data da última compra realizada pelo pagador em seu site. O formato válido do atributo é o seguinte - "yyyy-MM-dd'T'HH:mm:ssz". Ex - 2021-06-15T19:22:41.001-03:00.
authentication_type
string
Tipo de autenticação utilizada pelo pagador.
Gmail: Autenticação via Gmail.
Facebook: Autenticação via login do Facebook.
Native web: Autenticação via aplicação web.
Ver mais
shipments
object
Objeto que compreende todas as informações para o envio da compra do cliente.

Mostrar atributos
receiver_address
object
Objeto que compreende o endereço do destinatário da compra.

Mostrar atributos
zip_code
string
Código postal do comprador.
state_name
string
Nome do Estado em que se encontra o endereço do comprador.
city_name
string
Nome da cidade em que se encontra o endereço do comprador.
street_name
string
Rua onde mora o comprador.
street_number
number
Número do imóvel onde mora o comprador. Caso não possua um número, enviar "S/N".
floor
string
Andar do endereço de entrega.
apartment
string
Número do apartamento do endereço de entrega.
width
number
Largura do código de barras
height
number
Altura do código de barras
express_shipment
string
Indica se o envio é expresso ou não. Os valores válidos são os seguintes - "1" se for, "0" se não for.
pick_up_on_seller
string
Indica se o cliente irá retirar o produto no endereço do vendedor. Os valores válidos são os seguintes - "1" se for, "0" se não for.
application_fee
number
Comissão (taxa) que terceiros (integradores) cobram de seus clientes, neste caso, vendedores, pelo uso da plataforma do marketplace e de outros serviços. Esse é um valor em reais a ser definido pelo integrador ao vendedor.
Inserir valor
binary_mode
boolean
Quando definido como TRUE, os pagamentos só podem ser aprovados ou rejeitados. Caso contrário, eles também podem resultar in_process.

Inserir valor
callback_url
string
URL para a qual o Mercado Pago faz o redirecionamento final (apenas para transferência bancária).
Inserir valor
campaign_id
number
É o identificador da entidade que modela a natureza dos descontos. Todos os cupons vêm de uma única campanha. A campanha configura, entre outras coisas, o saldo orçamentário disponível, datas entre as quais os cupons pod...Ver mais
Inserir valor
capture
boolean
É um campo booleano existente em pagamentos de duas etapas (como o cartão de débito). Nesse tipo de pagamento, que é realizado de modo assíncrono, primeiro é feito a reserva do valor da compra (capture = false). Esse val...Ver mais

Inserir valor
coupon_amount
number
É o valor do cupom de desconto. Por exemplo - R$14,50. O tipo do atributo é BigDecimal.
Inserir valor
coupon_code
string
Campanha de desconto com um código específico
Inserir valor
description
string
Descrição do produto comprado, a razão de pagamento. Por exemplo - "Celular Xiaomi Redmi Note 11S 128gb 6gb Ram Versão Global Original azul" (descrição de um produto no marketplace).
Payment for product
differential_pricing_id
number
Atributo que comumente contém um acordo de quanto vai ser cobrado do usuário (geralmente, este campo é mais relevante para pagamentos do Marketplace). A precificação e as taxas são calculadas com base nesse identificador...Ver mais
Inserir valor
date_of_expiration
string
Data de expiração do pagamento. O formato válido do atributo é o seguinte - "yyyy-MM-dd HH:mm:ss.SSSz". Por exemplo - 2022-11-17T09:37:52.000-04:00.
Inserir valor
external_reference
string
É uma referência externa do pagamento. Pode ser, por exemplo, um hashcode do Banco Central, funcionando como identificador de origem da transação. Importante: Este campo deve ter no máximo 64 caracteres e deve conter ape...Ver mais
MP0001
installments
number
OBRIGATÓRIO

Número de parcelas selecionado
1
issuer_id
string
É o identificador do emissor do cartão que está sendo utilizado em um pagamento com cartão de crédito ou débito.
Inserir valor
metadata
object
Este é um objeto opcional do tipo chave-valor no qual o cliente pode adicionar informações adicionais que precisam ser registradas no pagamento. Ex - {"payments_group_size":1,"payments_group_timestamp":"2022-11-18T15:0...Ver mais
notification_url
string
URL de notificações disponível para receber notificações de eventos relacionados ao Pagamento. A quantidade máxima de caracteres permitidos para envio neste parâmetro é de 248 caracteres.
Inserir valor
payer
object
OBRIGATÓRIO

ID do pagador. Importante: Para pagamentos realizados via Pix (meio de pagamento do Brasil), os dados do pagador não são retornados por motivos de conformidade com o Banco Central

Mostrar atributos
Atributos de payer
entity_type
string
Tipo de entidade do pagador (apenas para transferências bancárias)
individual: Payer is individual.
association: Payer is an association.
type
string
Tipo de identificação do pagador associado (obrigatório se o pagador é um cliente).
customer: O pagador é um cliente registrado e está associado ao coletor.
guest: O pagador não possui uma conta.
id
number
Identificação do pagador associado.
email
string
OBRIGATÓRIO

Email associado ao payer. Este valor só retornará uma resposta quando status=approved, status=refunded ou status=charged_back.
identification
object
Identificação pessoal do usuário. Como exemplo, a nível Brasil, temos o CPF (Cadastro de Pessoa Física) e o CNPJ (Cadastro Nacional de Pessoas Jurídicas), para empresas. Outros códigos de identificação possíveis são o CU...Ver mais

Mostrar atributos
type
string
Refere-se ao tipo de identificação. Pode ser dos seguintes tipos.
CPF: Individual Taxpayer Registration, Brazil.
CNPJ: Cadastro de Pessoa Física, Brasil.
CUIT: Código Único de Identificación Tributaria, Argentina.
Ver mais
number
string
O número se refere ao identificador do usuário em questão. Se for um CPF, por exemplo, terá 11 números.
first_name
string
Nome do pagador associado
last_name
string
Sobrenome do pagante associado
payment_method_id
string
Indica o identificador do meio de pagamento selecionado para efetuar o pagamento. A seguir, apresentamos alguns exemplos. Obtenha todos os meios de pagamento disponíveis consultando a API de 'Obter meios de pagamento'.
Pix: Método de pagamento digital instantâneo utilizado no Brasil.
Debin_transfer: Método de pagamento digital utilizado na Argentina que debita imediatamente um valor da conta, solicitando autorização prévia.
Ted: É o pagamento por Transferência Eletrônica Disponível, usado no Brasil, que possui taxas de utilização. O pagamento é realizado no mesmo dia da transação, mas para isso, é necessário realizar a transferência dentro do período estipulado.
Ver mais

Pix
statement_descriptor
string
Descrição com a qual o pagamento aparecerá no resumo do cartão (ex. MERCADOPAGO)
Inserir valor
token
string
OBRIGATÓRIO

Identificador de token card (obrigatório para cartão de crédito). O token do cartão é criado a partir das próprias informações do cartão, aumentando a segurança durante o fluxo do pagamento. Além disso, uma vez que o tok...Ver mais
ff8080814c11e237014c1ff593b57b4d
transaction_amount
number
OBRIGATÓRIO

Custo do produto. Para o Chile (MLC) deve ser um número inteiro.
58

Ocultar parâmetros
Parâmetros de resposta
id
number
Identificador único de pagamento, gerado automaticamente pelo Mercado Pago.
date_created
string
Data de criação do pagamento.
date_approved
string
Data de aprovação do pagamento. Um pagamento pode ser gerado em um estado intermediário e depois aprovado, portanto, a data de criação nem sempre coincidirá com a Data de Aprovação.
date_last_updated
string
Data em que o último evento de pagamento foi registrado.
date_of_expiration
string
Data de expiração do pagamento. O formato válido do atributo é o seguinte - "yyyy-MM-dd'T'HH:mm:ssz". Ex. - 2022-11-17T09:37:52.000-04:00.
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
É o identificador do emissor do cartão que está sendo utilizado em um pagamento com cartão de crédito ou débito.
payment_method_id
string
Id do meio de pagamento. Indica o ID do meio de pagamento selecionado para efetuar o pagamento.
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
pending_capture: O pagamento foi autorizado e aguarda captura.
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
Descrição enviada na solicitação de criação de pagamento. Por exemplo - Em um pagamento pix, há a descrição “Pagamento de parcelas de Linha de Crédito”. Em outro caso, uma compra em loja física onde o cliente utiliza a m...Ver mais
live_mode
boolean
Indica se o Pagamento foi feito em ambiente de produção ou em ambiente de Teste. Se TRUE, o estorno será processado em modo de produção. Se FALSE, o estorno será processado no modo sandbox.
sponsor_id
string
Este campo está deprecado e não é mais utilizado.
authorization_code
string
Código de autorização de transação para pagamentos com “payment_method_type” do tipo “credit_card” (cartão de crédito), “debit_card” (cartão de débito) e “voucher_card” (cartão de voucher para benefícios, como Alelo). Em...Ver mais
money_release_schema
string
Esse campo é usado para identificar se um pagamento é PNF (pagamento no fluxo). Pagamento no fluxo é uma forma de liberação de dinheiro em que as parcelas recebidas por um vendedor são liberadas com o passar dos meses (q...Ver mais
taxes_amount
number
Corresponde aos valores dos impostos calculados para o pagamento.
counter_currency
string
Basicamente, é um objeto que permitirá converter em dólares pagamentos do tipo CBT (Cross Border Trade), que são pagamentos internacionais, feitos em moeda estrangeira.
shipping_amount
number
Valor da cobrança de envio da compra. É do tipo BigDecimal.
pos_id
string
Identificador digital do ponto de vendas (PDV). São pontos de vendas físicos que utilizam maquininha de cartão para vendas.
store_id
string
Identificador da loja à qual o caixa (PDV) pertence.
collector_id
number
É o usuário que recebe o dinheiro. Por exemplo - Um usuário (payer) compra um celular pelo marketplace. O identificador da loja/vendedor a receber o pagamento é o collector_id.
payer
object
Dados do pagador - ID (número de identificação), e-mail, identificação (tipo e número de documento)

Mostrar atributos
Atributos de payer
id
number
Identificador de pagador gerado pelo Mercado Pago.
email
string
Email associado ao payer. Este valor só retornará uma resposta quando status=approved, status=refunded ou status=charged_back.
identification
object
Identificação pessoal. Este valor só retornará uma resposta quando o status for aprovado, reembolsado ou com devolução de cobrança.

Mostrar atributos
number
string
O número se refere ao identificador do usuário em questão. Se for um CPF, por exemplo, terá 11 números.
type
string
Tipo de identificação
type
string
Tipo de identificação do pagador associado (obrigatório se o pagador é um cliente).
customer: O pagador é um cliente registrado e está associado ao coletor.
guest: O pagador não possui uma conta.
metadata
object
Este é um objeto opcional do tipo chave-valor no qual o cliente pode adicionar informações adicionais que precisam ser registradas no pagamento. Por exemplo - {"payments_group_size":1,"payments_group_timestamp":"2022-11-...Ver mais
additional_info
object
Informações adicionais

Mostrar atributos
Atributos de additional_info
items
array
Lista de itens a pagar.

Mostrar atributos
id
string
É o identificador do anúncio do produto comprado. Por exemplo - “MLB2907679857”.
title
string
Nome do item.
description
string
Descrição do artigo.
picture_url
string
URL da imagem.
category_id
string
Categoria do item.
quantity
number
Quantidade do produto.
unit_price
number
Preço unitário do item comprado. Este parâmetro será retornado como uma String. Para o Chile (MLC) deve ser um número inteiro.
payer
object
Detalhes do pagador.

Mostrar atributos
registration_date
string
Data de cadastro do comprador em seu site
shipments
object
Informações de envio

Mostrar atributos
receiver_address
object
Endereço do comprador

Mostrar atributos
street_name
string
Rua onde mora o comprador.
street_number
number
Número do imóvel onde mora o comprador. Caso não possua um número, enviar "S/N".
zip_code
string
Código postal do comprador.
city_name
string
Nome da cidade em que se encontra o endereço do comprador.
state_name
string
Nome do Estado em que se encontra o endereço do comprador.
external_reference
string
É uma referência externa do pagamento. Pode ser, por exemplo, um hashcode do Banco Central, funcionando como identificador de origem da transação.
transaction_amount
number
Custo do produto. Para o Chile (MLC) deve ser um número inteiro.
transaction_amount_refunded
number
Valor reembolsado da transação. Para o Chile (MLC) deve ser um número inteiro.
coupon_amount
number
É o valor do cupom de desconto. Para o Chile (MLC) deve ser um número inteiro.
differential_pricing_id
string
Atributo que comumente contém um acordo de quanto vai ser cobrado do usuário (geralmente, este campo é mais relevante para pagamentos do Marketplace). A precificação e as taxas são calculadas com base nesse identificador...Ver mais
deduction_schema
string
Esquema de Pricing aplicado pelo Mercado Pago. É um campo que representa as informações de um tipo de financiamento (parcelamento). Exemplo - “ahora12” é um schema que indica que o pagamento está parcelado em 12 vezes. E...Ver mais
transaction_details
object
Detalhes da transação.

Mostrar atributos
Atributos de transaction_details
payment_method_reference_id
string
Identificador único do meio de pagamento.
net_received_amount
number
Valor líquido recebido.
total_paid_amount
number
Valor total cobrado ao pagador.
overpaid_amount
number
Valor pago a mais.
external_resource_url
string
URL de recurso externo.
installment_amount
number
Valor da taxa de financiamento escolhida.
financial_institution
string
Instituição financeira.
payable_deferral_period
string
Período de diferimento de pagamento.
acquirer_reference
string
Referência do adquirente.
fee_details
array
Detalhe de comissão.

Mostrar atributos
Atributos de fee_details
type
string
Detalhe de comissão
mercadopago_fee: Taxa pelo uso do Mercado Pago.
coupon_fee: Desconto aplicado através de um cupom.
financing_fee: Custo do financiamento.
Ver mais
amount
number
Valor da comissão.
fee_payer
string
Quem absorve o custo da comissão
collector: O vendedor assume o custo.
payer: O comprador assume o custo.
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
Descrição com a qual o pagamento aparecerá no resumo do cartão (ex. MERCADOPAGO).
installments
number
Número de parcelas selecionado.
card
object
Informações do cartão.

Mostrar atributos
Atributos de card
id
string
Identificador de cartão.
first_six_digits
string
Bin do cartão.
last_four_digits
string
Últimos 4 dígitos do cartão.
expiration_month
number
Mês de validade do cartão.
expiration_year
number
Ano de validade do cartão.
date_created
string
Data de registro do cartão.
date_last_updated
string
Data em que o último evento de pagamento foi registrado.
cardholder
object
Detalhes do titular do cartão.

Mostrar atributos
name
string
Nome.
identification
object
Identificação pessoal.

Mostrar atributos
number
string
O número se refere ao identificador do usuário em questão. Se for um CPF, por exemplo, terá 11 números.
type
string
Tipo de identificação.
notification_url
string
URL de notificações disponível para receber notificações de eventos relacionados ao Pagamento. A quantidade máxima de caracteres permitidos para envio neste parâmetro é de 248 caracteres.
processing_mode
string
Modo de processamento. Existem dois tipos.
Aggregator: O merchant utilizará os códigos de merchant do Mercado Pago e aproveitará as vantagens financeiras que oferecemos.
Gateway: Para o merchant é necessário ter seus próprios códigos de merchant para vendas online e ter um acordo com cada um dos meios de pagamento desejados.
merchant_account_id
string
Identificador do código da loja comerciante. Aplica-se somente ao modelo gateway (porque a entrega de dinheiro ao comerciante não passa pelo sistema do Mercado Pago).
acquirer
string
Adquirente.
merchant_number
string
Número da loja (aplica-se ao modelo de gateway).
point_of_interaction
object
Informação da aplicação que processa o pagamento e recebe dados regulatórios.

Mostrar atributos
Atributos de point_of_interaction
type
string
Identificador do tipo de pagamento.
sub_type
string
Identificador secundário do tipo de pagamento.
application_data
object
Informação da aplicação que processa o pagamento.

Mostrar atributos
name
string
Nome da aplicação.
version
string
Versão atual da aplicação.
transaction_data
object
Informação do pagamento pendente que foi gerado.

Mostrar atributos
qr_code_base64
string
Representação em Base64 da imagem do código QR a ser digitalizado para finalização do pagamento.
qr_code
string
Código alfanumérico para copiar e colar, para finalizar o pagamento.
ticket_url
string
Link para o Pix renderizado, com códigos QR e instruções para pagar.