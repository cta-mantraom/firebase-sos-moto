Buscar em preferências
GET

https://api.mercadopago.com/checkout/preferences/search
Encontre todas as informações das preferências geradas através de filtros específicos ou por uma faixa de datas específica. Somente serão trazidos os dados dos últimos 90 dias (3 meses). Caso queira buscar dados mais antigos, utilize o GET de "Obter preferência".
Produtos relacionados:
Parâmetros de requisição
QUERY

Obrigatório

Opcional
sponsor_id
string
ID numérico exclusivo para identificar o sponsor. É usado para identificar em qual plataforma o fluxo de pagamento foi iniciado.
Inserir valor
external_reference
string
Referência que pode sincronizar com seu sistema de pagamentos.
Inserir valor
site_id
string
ID do site.
MLA: Mercado Libre Argentina
MLB: Mercado Libre Brasil
MLC: Mercado Libre Chile
Ver mais

marketplace
string
ID do Marketplace.
Inserir valor
Parâmetros de resposta
elements
array
Elements

Mostrar atributos
Atributos de elements
id
string
Identificação de preferência.
client_id
string
ID exclusivo usado para identificar o cliente. Obtido das credenciais usadas para criar a preferência. É o Application ID.
collector_id
number
ID exclusivo usado para identificar o coletor. É o mesmo que o Cust ID.
concept_id
string
ID exclusivo usado para identificar o conceito.
corporation_id
string
Identificador da corporação.
date_created
string
Data de registro
expiration_date_from
string
Data no formato "yyyy-MM-dd'T'HH:mm:ssz". que indica o início do período de validade da preferência. Isso pode ser usado, por exemplo, para vendas limitadas, onde os vendedores fazem uma oferta entre determinadas datas. ...Ver mais
expiration_date_to
string
Data no formato "yyyy-MM-dd'T'HH:mm:ssz" que indica o final do período de validade da preferência. Isso pode ser usado, por exemplo, para vendas limitadas, onde os vendedores fazem uma oferta entre determinadas datas. Po...Ver mais
expires
boolean
Preferência que determina se uma preferência expira.
external_reference
string
Referência que pode sincronizar com seu sistema de pagamentos.
integrator_id
string
Identificador do integrador.
items
array
items
last_updated
string
Data da última atualização.
live_mode
boolean
Indica se o Pagamento foi feito em ambiente de produção ou em ambiente de Teste. Se TRUE, o estorno será processado em modo de produção. Se FALSE, o estorno será processado no modo sandbox.
marketplace
string
Origem do pagamento. Este é um campo alfanumérico cujo valor padrão é NONE. Caso o coletor tenha seu próprio marketplace, é para onde são enviadas as credenciais para identificá-lo. Como o marketplace está associado ao A...Ver mais
operation_type
String
data_type da operação.
regular_payment: Pagamento normal.
money_transfer: Solicitação de dinheiro.
payer_email
string
E-mail do pagante.
platform_id
string
Identificador da plataforma.
processing_modes
string
Modo de processamento.
product_id
string
ID exclusivo usado para identificar o produto.
purpose
string
Este campo tem dois valores possíveis, empty e wallet_purchase.
site_id
string
ID exclusivo usado para identificar o site.
MLA: Mercado Libre Argentina
MLB: Mercado Libre Brasil
MLC: Mercado Libre Chile
Ver mais
sponsor_id
number
ID numérico exclusivo para identificar o sponsor. É usado para identificar em qual plataforma o fluxo de pagamento foi iniciado.
next_offset
number
Campo numérico usado para paginar a resposta.
total
number
total
Erros
400Erro

ds_search_query

invalid query.

401Erro

invalid_token

invalid_token.

invalid_caller_id

invalid caller_id