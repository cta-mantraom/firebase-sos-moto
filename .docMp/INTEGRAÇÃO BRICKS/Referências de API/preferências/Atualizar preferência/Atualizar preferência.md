Atualizar preferência
PUT

https://api.mercadopago.com/checkout/preferences/{id}
Atualizar os detalhes de uma preferência de pagamento. Digite o ID da preferência e envie as informações que você deseja atualizar.
Produtos relacionados:
Parâmetros de requisição
PATH

Obrigatório

Opcional
id
string
OBRIGATÓRIO

The preference's ID
Inserir valor
BODY

Obrigatório

Opcional
items
array
Informações sobre o item.

Mostrar atributos
Atributos de items
id
string
Indentificador do item.
title
string
Este é o título do item, que será exibido durante o processo de pagamento, no checkout, nas atividades e nos e-mails.
description
string
Esta é uma string livre onde a categoria do item pode ser adicionada.
picture_url
string
URL da imagem do anúncio.
category_id
string
Esta é uma string livre onde a categoria do item pode ser adicionada.
quantity
number
Quantidade de itens. Esta propriedade é usada para calcular o custo total.
currency_id
string
ID exclusivo para identificar a moeda. Código ISO_4217. Alguns sites permitem moeda local e USD, mas é importante observar que o valor é convertido para moeda local quando a preferência é criada, pois o checkout sempre processa as transações em moeda local. Se você estiver usando USD, observe que esse valor não é atualizado automaticamente se o valor da moeda local mudar em relação ao USD.
ARS: Argentine peso.
BRL: Brazilian real.
CLP: Chilean peso.
Ver mais
unit_price
number
Preço unitário do item. Essa propriedade é usada em conjunto com a propriedade de quantity para determinar o custo do pedido. Para o Chile (MLC) deve ser um número inteiro.
payer
object
Informações do comprador, como nome, sobrenome, e-mail, telefone, identificação pessoal, endereço e data de registro.

Mostrar atributos
Atributos de payer
name
string
Nome do comprador.
surname
string
Apelido do comprador.
email
string
Endereço de e-mail do comprador.
phone
object
Telefone do comprador.

Mostrar atributos
area_code
string
Código de área.
number
number
Número.
identification
object
Identificação pessoal.

Mostrar atributos
type
string
Tipo de identificação.
number
string
Número.
address
object
Endereço do comprador.

Mostrar atributos
zip_code
string
Código postal.
street_name
string
Rua.
street_number
number
O Número.
date_created
string
Data de registro.
payment_methods
object
Todas as configurações são relacionadas ao métodos de pagamento, como, por exemplo, métodos de pagamento excluídos, tipos de pagamento excluídos, método de pagamento padrão e taxas.

Mostrar atributos
Atributos de payment_methods
excluded_payment_methods
array
Métodos de pagamento excluídos do checkout (exceto account_money, que estará sempre disponível). Os métodos de pagamento aqui incluídos não estarão disponíveis no checkout.

Mostrar atributos
id
string
Identificador do método de pagamento.
excluded_payment_types
array
Tipos de pagamento excluídos do processo de pagamento. Os tipos de pagamento incluídos aqui não estarão disponíveis no checkout.

Mostrar atributos
id
string
Identificador de data_type do meio de pagamento.
default_payment_method_id
string
Forma de pagamento sugerida. O usuário iniciará o pagamento com esta forma de pagamento já selecionada. Considera-se sugerido porque os Checkouts seguem lógicas diferentes para selecionar o melhor meio de pagamento para ...Ver mais
installments
number
Número máximo de parcelas.
default_installments
number
Preferência de parcelas.
shipments
object
Informações de envio.

Mostrar atributos
Atributos de shipments
mode
string
Modo de envio.
custom: Envio personalizado. Não disponível para Checkout Pro ou Link de pagamento.
me2: Mercado Envios.
not_specified: Modo de envio não especificado.
local_pickup
boolean
The payer have the option to pick up the shipment in your store (mode:me2 only).
dimensions
string
Tamanho do pacote em cm x cm x cm, gr (mode:me2 somente).
default_shipping_method
number
Escolha um método de envio padrão no checkout (mode:me2 somente).
free_methods
array
Oferecer um método de frete grátis (mode:me2 somente).

Mostrar atributos
id
number
Identificador do método de envio.
cost
number
Custo do transporte (mode:custom somente).
free_shipping
boolean
Preferência de frete grátis para mode:custom.
receiver_address
object
Endereço de envio.

Mostrar atributos
zip_code
string
Código postal.
street_name
string
Rua.
city_name
string
Cidade.
state_name
string
Estado.
street_number
number
O Número.
floor
string
Andar.
apartment
string
Apartamento.
country_name
string
Nome do país.
back_urls
object
URLs de retorno ao site do vendedor, automaticamente ("auto_return") ou através do botão 'Voltar ao site', segundo o status do pagamento. É obrigatório o uso do protocolo ("https") na URL.

Mostrar atributos
Atributos de back_urls
success
string
URL de retorno ante o pagamento aprovado.
pending
string
URL de retorno diante de pagamento pendente ou em processo.
failure
string
URL de retorno ante o pagamento cancelado.
notification_url
string
URL de notificações disponível para receber notificações de eventos relacionados ao Pagamento. A quantidade máxima de caracteres permitidos para envio neste parâmetro é de 248 caracteres. É obrigatório o uso do protocolo...Ver mais
Inserir valor
additional_info
string
Informações adicionais.
Inserir valor
auto_return
String
No caso de estar especificado, o comprador será redirecionado para o site do vendedor automaticamente após a compra aprovada com cartão de crédito.
approved: O redirecionamento ocorre apenas para pagamentos aprovados com cartão de crédito.
all: O redirecionamento ocorre apenas para pagamentos aprovados com cartão de crédito, compatibilidade futura somente se alterarmos o comportamento padrão.
external_reference
string
Referência que pode sincronizar com seu sistema de pagamentos.
Inserir valor
expires
boolean
Preferência que determina se uma preferência expira.

Inserir valor
date_of_expiration
string
Data de expiração de meios de pagamento em dinheiro.
Inserir valor
expiration_date_from
string
Data no formato "yyyy-MM-dd'T'HH:mm:ssz". que indica o início do período de validade da preferência. Isso pode ser usado, por exemplo, para vendas limitadas, onde os vendedores fazem uma oferta entre determinadas datas. ...Ver mais
2022-11-17T09:37:52.000-04:00
expiration_date_to
string
Data no formato "yyyy-MM-dd'T'HH:mm:ssz" que indica o final do período de validade da preferência. Isso pode ser usado, por exemplo, para vendas limitadas, onde os vendedores fazem uma oferta entre determinadas datas. Po...Ver mais
2022-11-17T10:37:52.000-05:00
marketplace
string
Origem do pagamento. Este é um campo alfanumérico cujo valor padrão é NONE. Caso o coletor tenha seu próprio marketplace, é para onde são enviadas as credenciais para identificá-lo. Como o marketplace está associado ao A...Ver mais
Inserir valor
marketplace_fee
number
Taxa de Marketplace cobrada pelo proprietário da aplicação. É um valor fixo e seu valor padrão é 0 em moeda local. Esta propriedade só pode ser apresentada se também tiver sido definido um marketplace válido e, caso cont...Ver mais
0
differential_pricing
object
Configuração de preço diferencial para esta preferência. O vendedor pode ter sua própria configuração em relação às formas de pagamento e taxas, e é neste parâmetro que incluirá o ID numérico para indicá-lo. Esse valor é...Ver mais

Mostrar atributos
Atributos de differential_pricing
id
number
Identificador de preço diferenciado.
metadata
object
JSON válido que pode ser adicionado ao pagamento para salvar atributos adicionais.

Ocultar parâmetros
Parâmetros de resposta
Erros
400Erro

invalid_collector_id

collector_id invalid.

invalid_sponsor_id

sponsor_id is not an active user.

invalid_collector_email

collector is not collector_email owner.

invalid_operation_type

operation_type invalid.

invalid_expiration_date_to

expiration_date_to invalid.

invalid_date

invalid date of expiration.

invalid_expiration_date_from

expiration_date_from invalid.

invalid_items

unit_price invalid.

invalid_back_urls

back_urls invalid. Wrong format.

invalid_payment_methods

installments invalid. Should be a number between 1 and 36.

invalid_marketplace_fee

marketplace_fee must not be greater than total amount.

invalid_id

preference_id not found.

invalid_access_token

access denied

invalid_shipments

invalid type (<type>) for field shipments.cost.