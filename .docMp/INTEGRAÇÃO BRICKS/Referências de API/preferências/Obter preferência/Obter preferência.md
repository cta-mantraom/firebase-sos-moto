Obter preferência
GET

https://api.mercadopago.com/checkout/preferences/{id}
Veja todas as informações de pagamento de um produto ou serviço com a identificação da preferência desejada.
Produtos relacionados:
Parâmetros de requisição
PATH

Obrigatório

Opcional
id
string
OBRIGATÓRIO

Identificação de preferência.
Inserir valor
Parâmetros de resposta
additional_info
string
Informações adicionais.
auto_return
String
No caso de estar especificado, o comprador será redirecionado para o site do vendedor automaticamente após a compra aprovada com cartão de crédito.
approved: O redirecionamento ocorre apenas para pagamentos aprovados com cartão de crédito.
all: O redirecionamento ocorre apenas para pagamentos aprovados com cartão de crédito, compatibilidade futura somente se alterarmos o comportamento padrão.
back_urls
object
URLs de retorno ao site do vendedor, automaticamente ("auto_return") ou através do botão 'Voltar ao site', segundo o status do pagamento.

Mostrar atributos
Atributos de back_urls
failure
string
URL de retorno ante o pagamento cancelado.
pending
string
URL de retorno diante de pagamento pendente ou em processo.
success
string
URL de retorno ante o pagamento aprovado.
client_id
string
ID exclusivo usado para identificar o cliente. Obtido das credenciais usadas para criar a preferência. É o Application ID.
collector_id
number
ID exclusivo usado para identificar o coletor. É o mesmo que o Cust ID.
date_created
string
Data de registro.
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
id
string
ID exclusivo gerado automaticamente que identifica a preferência. Por exemplo 036151801-2484cd71-7140-4c51-985a-d4cfcf133baf.
init_point
string
URL gerado automaticamente para abrir o Checkout.
items
array
Informações sobre o item.

Mostrar atributos
Atributos de items
id
string
Id do anúncio.
currency_id
string
ID exclusivo para identificar a moeda. Código ISO_4217. Alguns sites permitem moeda local e USD, mas é importante observar que o valor é convertido para moeda local quando a preferência é criada, pois o checkout sempre processa as transações em moeda local. Se você estiver usando USD, observe que esse valor não é atualizado automaticamente se o valor da moeda local mudar em relação ao USD.
ARS: Argentine peso.
BRL: Brazilian real.
CLP: Chilean peso.
Ver mais
title
string
Este é o título do item, que será exibido durante o processo de pagamento, no checkout, nas atividades e nos e-mails.
picture_url
string
URL da imagem do anúncio.
description
string
Esta é uma string livre onde a categoria do item pode ser adicionada.
category_id
string
Esta é uma string livre onde a categoria do item pode ser adicionada.
quantity
number
Quantidade de itens. Esta propriedade é usada para calcular o custo total.
unit_price
number
Preço unitário do item. Essa propriedade é usada em conjunto com a propriedade de quantity para determinar o custo do pedido. Para o Chile (MLC) deve ser um número inteiro.
marketplace
string
Origem do pagamento. Este é um campo alfanumérico cujo valor padrão é NONE. Caso o coletor tenha seu próprio marketplace, é para onde são enviadas as credenciais para identificá-lo. Como o marketplace está associado ao A...Ver mais
marketplace_fee
number
Taxa de Marketplace cobrada pelo proprietário da aplicação. É um valor fixo e seu valor padrão é 0 em moeda local. Esta propriedade só pode ser apresentada se também tiver sido definido um marketplace válido e, caso cont...Ver mais
notification_url
string
URL de notificações disponível para receber notificações de eventos relacionados ao Pagamento. A quantidade máxima de caracteres permitidos para envio neste parâmetro é de 248 caracteres. É obrigatório o uso do protocolo...Ver mais
statement_descriptor
string
O statement descriptor é um texto longo (até 13 caracteres) que será exibido na fatura do cartão de crédito do pagador para identificar facilmente a compra.
operation_type
String
data_type da operação.
regular_payment: Pagamento normal.
money_transfer: Solicitação de dinheiro.
payer
object
Informações do comprador, como nome, sobrenome, e-mail, telefone, identificação pessoal, endereço e data de registro.

Mostrar atributos
Atributos de payer
phone
object
Telefone do comprador.

Mostrar atributos
area_code
string
Código de área.
number
string
Número de telefone.
address
object
Endereço do comprador.

Mostrar atributos
zip_code
string
Código postal.
street_name
string
Nome da rua.
street_number
string
O Número da rua.
email
string
E-mail do pagante.
identification
object
Identificador de pagador.

Mostrar atributos
number
string
Número de identificação.
type
string
Tipo de identificação.
name
string
Nome do comprador.
surname
string
Sobrenome do comprador.
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
Id do meio de pagamento.
default_installments
string
Preferência de parcelas.
default_payment_method_id
string
Forma de pagamento sugerida. O usuário iniciará o pagamento com esta forma de pagamento já selecionada. Considera-se sugerido porque os Checkouts seguem lógicas diferentes para selecionar o melhor meio de pagamento para ...Ver mais
excluded_payment_types
array
Tipos de pagamento excluídos do processo de pagamento. Os tipos de pagamento incluídos aqui não estarão disponíveis no checkout.

Mostrar atributos
id
string
Identificador do tipo de pagamento.
installments
string
Número Máximo de cotas.
sandbox_init_point
string
URL gerado automaticamente para abrir o Checkout no modo sandbox. Usuários reais são usados ​​aqui, mas as transações são executadas com credenciais de teste.
shipments
object
Informações de envio.

Mostrar atributos
Atributos de shipments
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

Ocultar parâmetros
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

invalid_expiration_date_from

expiration_date_from invalid.

invalid_items

unit_price invalid.

invalid_payer

payer email invalid. Max length 150.

invalid_back_urls

back_urls invalid. Wrong format.

invalid_payment_methods

installments invalid. Should be a number between 1 and 36.

invalid_marketplace_fee

marketplace_fee must not be greater than total amount.

invalid_id

preference_id not found.

invalid_access_token

access denied.

invalid_shipments

Invalid total amount, with me2 it cannot be lesser than <limit>.