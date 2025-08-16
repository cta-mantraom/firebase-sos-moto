Webhooks
Webhooks (também conhecidos como web callbacks) são um método simples que permite que um aplicativo ou sistema forneça informações em tempo real sempre que um evento ocorre. É uma forma passiva de receber dados entre dois sistemas por meio de uma HTTP POSTsolicitação.

Notificações de webhooks podem ser configuradas para cada aplicativo criado em "Suas integrações" . Você também pode configurar uma URL de teste que, juntamente com suas credenciais de teste, permite testar o funcionamento correto das suas notificações antes de colocá-las no ar.

Uma vez configurado, o Webhook será enviado sempre que ocorrer um ou mais eventos registrados, eliminando a necessidade de verificações constantes e evitando assim sobrecarga do sistema e perda de dados em situações críticas.

Para configurar suas notificações de Webhooks, escolha uma das opções abaixo:

Tipo de configuração Descrição
Configuração através de suas integrações Permite configurar notificações para cada um dos seus aplicativos, identificando contas diferentes se necessário e validando a origem da notificação usando a assinatura secreta (exceto notificações para integrações de QR Code).
Configuração durante a criação do pagamento Permite configuração específica de notificações para cada pagamento, preferência ou pedido. Esta configuração não é permitida para Mercado Pago Point.
Importante
Os URLs configurados durante a criação do pagamento terão precedência sobre aqueles configurados por meio de suas integrações.
Depois que as notificações estiverem configuradas, consulte as ações necessárias após receber uma notificação para validar se as notificações foram recebidas corretamente.

Configuração através de suas integrações
Configure notificações para cada aplicativo diretamente em suas integrações de forma eficiente e segura. Nesta documentação, explicaremos como:

Especifique URLs e configure eventos
Validar a fonte de notificação
Simule o recebimento da notificação
Importante
Este método de configuração não está disponível para integrações com QR Code ou Assinaturas. Para configurar notificações para qualquer uma dessas integrações, use o método "Configuração durante a criação do pagamento" .

1. Especifique URLs e configure eventos
   Para configurar notificações de Webhooks por meio de suas integrações, é necessário especificar as URLs onde elas serão recebidas e os eventos para os quais você deseja receber notificações.

Para fazer isso, siga estes passos:

Acesse Suas integrações e selecione o aplicativo para o qual deseja habilitar notificações. Se você ainda não criou um aplicativo, acesse a documentação do Painel do Desenvolvedor e siga as instruções para fazê-lo.
No menu à esquerda, clique em Webhooks > Configurar notificações e configure as URLs que serão usadas para receber notificações. Recomendamos usar URLs diferentes para o modo de teste e o modo de produção:
URL do modo de teste: forneça uma URL que permita testar o funcionamento correto das notificações para este aplicativo durante a fase de teste ou desenvolvimento. O teste dessas notificações deve ser feito exclusivamente com as credenciais de teste de usuários produtivos .
URL do modo de produção: forneça uma URL para receber notificações com sua integração produtiva. Essas notificações devem ser configuradas com credenciais produtivas .
webhooks

Observação
Se precisar identificar várias contas, você pode adicionar o parâmetro ?cliente=(sellersname)à URL do ponto de extremidade para identificar os vendedores.
Selecione os eventos dos quais deseja receber notificações no JSONformato "e" HTTP POSTpara a URL especificada anteriormente. Um evento pode ser qualquer tipo de atualização no objeto relatado, incluindo alterações de status ou atributos. Consulte a tabela abaixo para ver os eventos que podem ser configurados, considerando a solução integrada do Mercado Pago e suas especificidades de negócio.
Eventos Nome em suas integrações Tópico Produtos associados
Criação e atualização de pagamentos Pagamentos payment Checkout Transparente
Checkout Pro
Checkout Bricks
Assinaturas
Wallet Connect
Pagamento recorrente de uma assinatura (criação - atualização) Planos e Assinaturas subscription_authorized_payment Assinaturas
Vinculação de assinatura (criação - atualização) Planos e Assinaturas subscription_preapproval Assinaturas
Vinculação de plano de assinatura (criação - atualização) Planos e Assinaturas subscription_preapproval_plan Assinaturas
Vinculação e desvinculação de contas conectadas via OAuth Vinculação de aplicativos mp-connect Todos os produtos que implementaram o OAuth
Transações do Wallet Connect Conexão de carteira wallet_connect Conexão de carteira
Alertas de fraude após processamento do pedido Alertas de fraude stop_delivery_op_wh Checkout Transparente
Checkout Pro
Criação de reembolsos e reclamações Reivindicações topic_claims_integration_wh Checkout Transparente
Checkout Pro
Checkout Bricks
Assinaturas
Mercado Pago Point
QR Code
Wallet Connect
Recuperação de informações do cartão e atualização dentro do Mercado Pago Atualizador de cartão topic_card_id_wh Checkout Pro
Checkout Transparente
Checkout Bricks
Criação, encerramento ou expiração de ordens comerciais Pedidos comerciais topic_merchant_order_wh
Código QR do Checkout Pro
Abertura de chargebacks, alterações de status e modificações relacionadas à liberação de fundos Estornos topic_chargebacks_wh Checkout Pro
Checkout Transparente
Checkout Bricks
Finalização e cancelamento de tentativa de pagamento, ou erro no processamento de tentativa de pagamento em dispositivos Mercado Pago Point. Integrações de pontos point_integration_wh Ponto Mercado Pago
Importante
Caso tenha alguma dúvida sobre os tópicos a serem desativados ou os eventos que serão notificados, consulte a documentação Informações adicionais sobre notificações .
Por fim, clique em Salvar . Isso gerará uma assinatura secreta exclusiva para o seu aplicativo, permitindo que você valide a autenticidade das notificações recebidas, garantindo que elas foram enviadas pelo Mercado Pago. Observe que a assinatura gerada não tem data de validade e sua renovação periódica não é obrigatória, mas altamente recomendada. Basta clicar no botão Redefinir ao lado da assinatura para renová-la.
Importante
As notificações por QR Code não podem ser verificadas usando a assinatura secreta. Portanto, você deve prosseguir diretamente para a etapa Simular recebimento de notificações. Se você possui uma integração com QR Code e ainda deseja verificar a origem das suas notificações, entre em contato com o Suporte do Mercado Pago . 2. Validar a origem da notificação
As notificações enviadas pelo Mercado Pago serão semelhantes ao seguinte exemplo para um paymentalerta de tópico:

{
"id" : 12345 ,
"live_mode" : true ,
"type" : "payment" ,
"date_created" : "2015-03-25T10:04:58.396-04:00" ,
"user_id" : 44444 ,
"api_version" : "v1" ,
"action" : "payment.created" ,
"data" : {
"id" : "999999999"
}
}
O Mercado Pago sempre incluirá a assinatura secreta nas notificações de Webhooks recebidas na URL cadastrada, o que permitirá validar sua autenticidade para oferecer maior segurança e evitar possíveis fraudes.

Esta assinatura será enviada no x-signaturecabeçalho, conforme mostrado no exemplo abaixo.

`ts=1704908010,v1=618c85345248dd820d5fd456117c2ab2ef8eda45a0282ff693eac24131a5e839`
Para configurar essa validação, você precisa extrair a chave contida no cabeçalho e compará-la com a chave fornecida para sua aplicação em "Suas integrações". Você pode fazer isso seguindo os passos abaixo. Ao final, fornecemos alguns SDKs com um exemplo de código completo para facilitar o processo:

Para extrair o timestamp ( ts) e a assinatura do x-signaturecabeçalho, divida o conteúdo do cabeçalho pelo caractere "," , o que resultará em uma lista de 2 elementos. O valor do tsprefixo é o timestamp (em milissegundos) da notificação e v1é a assinatura criptografada. Seguindo o exemplo apresentado acima, ts=1704908010e v1=618c85345248dd820d5fd456117c2ab2ef8eda45a0282ff693eac24131a5e839.
Usando o modelo e as descrições abaixo, substitua os parâmetros pelos dados recebidos na sua notificação.
id:[data.id_url];id-da-solicitação:[x-id-da-solicitação_cabeçalho];ts:[ts_cabeçalho];
Parâmetros com o \_urlsufixo vêm de parâmetros de consulta. Exemplo: [data.id_url]será substituído pelo valor do ID do evento correspondente ( data.id) e, neste caso, se data.id_urlfor alfanumérico, deverá ser enviado em letras minúsculas. Este parâmetro de consulta pode ser encontrado na notificação recebida.
[ts_header]representará o tsvalor extraído do x-signaturecabeçalho.
[x-request-id_header]deve ser substituído pelo valor recebido no x-request-idcabeçalho.
Importante
Se algum dos valores mostrados no modelo acima não estiver presente na sua notificação, você deverá removê-lo.
Em Suas integrações , selecione o aplicativo integrado e navegue até a seção Webhooks para revelar a assinatura secreta gerada.
Gere a chave de validação. Para isso, calcule um HMAC (Código de Autenticação de Mensagem Baseado em Hash) usando a SHA256 hashfunção em base hexadecimal. Use a assinatura secreta como chave e o modelo preenchido com os respectivos valores como mensagem.
$cyphedSignature = hash_hmac ( 'sha256' , $dados , $chave ) ;
Por fim, compare a chave gerada com a chave extraída do cabeçalho, garantindo que sejam exatamente iguais. Além disso, você pode usar o carimbo de data/hora extraído do cabeçalho para compará-lo com um carimbo de data/hora gerado no momento do recebimento da notificação. Isso permite estabelecer uma margem de tolerância para atrasos no recebimento da mensagem.
Veja exemplos de código completo abaixo:

// Obter o valor x-signature do cabeçalho
const xSignature = headers [ 'x-signature' ] ; // Assumindo que headers é um objeto que contém cabeçalhos de solicitação
const xRequestId = headers [ 'x-request-id' ] ; // Assumindo que headers é um objeto que contém cabeçalhos de solicitação

// Obter parâmetros de consulta relacionados à URL da solicitação const urlParams = new URLSearchParams ( window.location.search ) ; const dataID = urlParams.get ( ' data.id ' ) ;

// Separando a assinatura x em partes
const parts = xSignature . split ( ',' ) ;

// Inicializando variáveis para armazenar ts e hash
let ts ;
let hash ;

// Itere sobre os valores para obter as partes ts e v1 . forEach ( part => {
// Divida cada parte em chave e valor
const [ key , value ] = part . split ( '=' ) ;
if ( key && value ) {
const trimmedKey = key . trim ( ) ;
const trimmedValue = value . trim ( ) ;
if ( trimmedKey === 'ts' ) {
ts = trimmedValue ;
} else if ( trimmedKey === 'v1' ) {
hash = trimmedValue ;
}
}
} ) ;

// Obtenha a chave secreta para o usuário/aplicativo no site de desenvolvedores do Mercadopago
const secret = 'your_secret_key_here' ;

// Gerar a string de manifesto
const manifest = `id: ${ dataID } ;request-id: ${ xRequestId } ;ts: ${ ts } ;` ;

// Crie uma assinatura HMAC
const hmac = crypto . createHmac ( 'sha256' , secret ) ;
hmac . update ( manifest ) ;

// Obtenha o resultado do hash como uma string hexadecimal
const sha = hmac . digest ( 'hex' ) ;

if ( sha === hash ) {
// A verificação HMAC foi aprovada
console . log ( "A verificação HMAC foi aprovada" ) ;
} else {
// A verificação HMAC falhou
console . log ( "A verificação HMAC falhou" ) ;
} 3. Simule o recebimento da notificação
É necessário simular o recebimento de notificações para verificar se elas estão configuradas corretamente. Para isso, siga estes passos:

Após configurar as URLs e os eventos desejados, clique em Salvar para salvar a configuração.
Depois, clique em Simular para testar se a URL especificada está recebendo notificações corretamente.
Na tela de simulação, selecione a URL a ser testada, que pode ser uma URL de teste ou de produção .
Em seguida, selecione o tipo de evento desejado e insira a identificação que será enviada no corpo da notificação.
Por fim, clique em Enviar teste para verificar a solicitação, a resposta do servidor e a descrição do evento.
Configuração durante a criação do pagamento
Durante o processo de criação de um pagamento, preferência ou pedido, é possível configurar a URL de notificação mais especificamente para cada pagamento usando o notification_urlcampo e implementando o receptor de notificação necessário.

Importante
Não é possível configurar notificações para o tópico point_integration_wh usando este método. Para ativá-lo, use as configurações de suas integrações .
A seguir, explicamos como fazer isso com a ajuda dos SDKs.

No notification_urlcampo, especifique a URL onde as notificações serão recebidas, conforme mostrado no exemplo abaixo. Para receber notificações exclusivamente via Webhooks e não via IPN, você pode adicionar o parâmetro source_news=webhooksao campo notification_url. Por exemplo: https://www.yourserver.com/notifications?source_news=webhooks.

<?php  
$client  =  novo  PagamentoCliente ( ) ;

        $body  =  [ 
            'transaction_amount'  =>  100 , 
            'token'  =>  'token' , 
            'description'  =>  'description' , 
            'installments'  =>  1 , 
            'payment_method_id'  =>  'visa' , 
            'notification_url'  =>  'http://test.com' , 
            'payer'  =>  array ( 
                'email'  =>  'test@test.com' , 
                'identification'  =>  array ( 
                    'type'  =>  'CPF' , 
                    'number'  =>  '19119119100' 
                ) 
            ) 
        ] ;

$cliente -> criar ( corpo ) ; 
?>

Implemente o receptor de notificação usando o seguinte código como exemplo:

<?php 
 MercadoPago \ SDK :: setAccessToken ( "ENV_ACCESS_TOKEN" ) ; 
 switch ( $_POST [ "tipo" ] )  { 
     case  "pagamento" : 
         $pagamento  =  MercadoPago \ Pagamento :: find_by_id ( $_POST [ "dados" ] [ "id" ] ) ; 
         break ; 
     case  "plano" : 
         $plano  =  MercadoPago \ Plano :: find_by_id ( $_POST [ "dados" ] [ "id" ] ) ; 
         break ; 
     case  "assinatura" : 
         $plano  =  MercadoPago \ Assinatura :: find_by_id ( $_POST [ "dados" ] [ "id" ] ) ; 
         break ; 
     case  "fatura" : 
         $plano  =  MercadoPago \ Fatura :: find_by_id ( $_POST [ "dados" ] [ "id" ] ) ; 
         break ; 
     case  "point_integration_wh" : 
         // $_POST contém as informações relacionadas à notificação. 
         quebrar ; 
 } 
?>

Após as configurações necessárias, a notificação de Webhooks será entregue no JSONformato . Veja o exemplo de uma notificação para o paymentstópico e as descrições das informações enviadas na tabela abaixo.

Importante
Pagamentos de teste, criados com credenciais de teste, não enviarão notificações. A única maneira de testar o recebimento de notificações é por meio da Configuração, em Suas integrações .
{
"id" : 12345 ,
"live_mode" : true ,
"type" : "payment" ,
"date_created" : "2015-03-25T10:04:58.396-04:00" ,
"user_id" : 44444 ,
"api_version" : "v1" ,
"action" : "payment.created" ,
"data" : {
"id" : "999999999"
}
}
Atributo Descrição Exemplo em JSON
eu ia ID de notificação 12345
modo_ao_vivo Indica se o URL fornecido é válido true
tipo Tipo de notificação recebida de acordo com o tópico selecionado anteriormente (pagamentos, mp-connect, assinatura, reclamação, pagamentos automáticos, etc.) payment
data_criação Data em que o recurso notificado foi criado 2015-03-25T10:04:58.396-04:00
ID do usuário Identificador do vendedor 44444
versão_api Valor que indica a versão da API que está enviando a notificação v1
Ação Evento notificado, indicando se é uma atualização de recurso ou uma nova criação payment.created
dados.id ID do pagamento, merchant_orderou reclamação 999999999
Importante
Para obter o formato de notificação para tópicos diferentes de payment, como point_integration_wh, topic_claims_integration_whe topic_card_id_wh, consulte Informações adicionais sobre notificações .
Ações necessárias após receber uma notificação
Ao receber uma notificação na sua plataforma, o Mercado Pago espera uma resposta para validar o recebimento correto. Para isso, você precisa retornar um status HTTP STATUS 200 (OK)ou .201 (CREATED)

O tempo de espera para confirmação do recebimento de notificações é de 22 segundos . Caso essa confirmação não seja enviada, o sistema entenderá que a notificação não foi recebida e tentará reenviá-la a cada 15 minutos até receber uma resposta. Após a terceira tentativa, o intervalo será estendido, mas as tentativas continuarão.

Após responder à notificação e confirmar seu recebimento, você poderá obter as informações completas do recurso notificado fazendo uma solicitação ao endpoint da API correspondente. Para identificar qual endpoint usar, consulte a tabela abaixo:

Tipo URL Documentação
pagamento https://api.mercadopago.com/v1/payments/[ID] Receber pagamento
pré-aprovação de assinatura https://api.mercadopago.com/preapproval/search Pesquisar assinaturas
plano_de_pré-aprovação_de_assinatura https://api.mercadopago.com/preapproval_plan/search Pesquisar planos de assinatura
pagamento_autorizado_por_assinatura https://api.mercadopago.com/authorized_payments/[ID] Obter dados de faturas
integração_de_pontos_wh https://api.mercadopago.com/point/integration-api/payment-intents/{paymentintentid} Pesquisar intenção de pagamento
tópico_reivindicações_integração_wh https://api.mercadopago.com/post-purchase/v1/claims/[claim_id] Obter detalhes da reclamação
tópico_pedido_comerciante_wh https://api.mercadopago.com/merchant_orders/[ID] Obter pedido
tópico_estornos_wh https://api.mercadopago.com/v1/chargebacks/[ID] Obter estorno
Com essas informações, você poderá fazer as atualizações necessárias na sua plataforma, como atualizar um pagamento aprovado.

Painel de notificações
O painel de notificações permite que o usuário visualize os eventos acionados em uma integração específica, verifique o status e obtenha informações detalhadas sobre esses eventos.

Este painel será exibido depois que você configurar suas notificações de Webhooks, e você poderá acessá-lo a qualquer momento clicando em Webhooks em Suas integrações .

Entre as informações disponíveis, você encontrará a porcentagem de notificações entregues, bem como uma visualização rápida de quais URLs e eventos estão configurados.

Além disso, você encontrará uma lista completa das últimas notificações enviadas e seus detalhes, como status de entrega (sucesso ou falha), ação (ação associada ao evento acionado), evento (tipo de evento acionado) e data e hora . Se desejar, você pode filtrar os resultados exibidos por status de entrega e por período ( data e hora ).

painel de notificações

Detalhes do evento
Ao clicar em uma das notificações listadas, você pode acessar os detalhes do evento. Esta seção fornece informações adicionais, permitindo que você recupere dados perdidos em caso de falha na entrega da notificação, mantendo assim seu sistema atualizado.

Status: status do evento juntamente com o código de sucesso ou erro correspondente.
Evento: Tipo de evento acionado conforme selecionado na configuração de notificação.
Tipo: Tópico ao qual o evento disparado pertence, conforme selecionado durante a configuração.
Data e hora do acionamento: Data e hora em que o evento foi acionado.
Descrição: Descrição detalhada do evento conforme documentado.
ID do gatilho: Identificador exclusivo da notificação enviada.
Solicitação: JSON da solicitação correspondente à notificação disparada.
detalhes das notificações

Em caso de falha na entrega da notificação, você pode visualizar os motivos e corrigir as informações necessárias para evitar problemas futuros.
