em   temos 
estruturas que não reflete a nossa estrutura 
em  temos abaixo 
não usamos mais  - **firebase-functions**: ^6.4.0 

abaixo falta  qstash com sistema de filas 
### Backend (Vercel APIs - memoryys.com/api/*)
- **3 APIs Vercel Functions:**
  - `create-payment` - MercadoPago + Firestore + QR + Email
  - `mercadopago-webhook` - Webhook + processamento
  - `get-profile` - Busca perfis (Redis cache)
  - `check-status` - Status via Redis

em não sei se reflete nosso sistema 

bom acima uma documentação que não ultizamos mais hoje temos 2 serviços da firebase ativos  
Storage
Firestore Database
abaixo algumas imformação dessa  refatoração que saiu do banco de dados supabase  usou functions do firebase agora estamos somente com Atalhos de projetos
Storage
Firestore Database e vamos continuar mas temos varios questão para criar um documento mais detalhado  com fluxo real nos arquivos em  temos algumas refras importantes sobre any bibliotecas que estmos usando sobre unknown sobre que não vamos gerar testes nesse mommento nem flar sobre testes nos arquivos de documneteção queremos um adocumentação que visa melhorara e esclareser as lacunas que nosso sistema tem com falta de boa sepração por funcionalidades como por exemplo no arquivo  que tem varias responsabilidades que não copetem a ele isso é realemte grave temso uma pasta  que tem  que pode ter algo relacionado aos serviços esternos como redis qstash aws  e outros dentro de  temos outras pastas que podem ser alinhadas como nosso sistema  cada serviço deve cuidar da sua propria resposabilidade podemos ter um arqui final-processor que pode até orquestrar algo mas sem sobrecaregalo nosso sistema foca em agilidadee no momento que o socorista quer ler o qr code então presisamos ter um sistema onde se flahar a leitura do redis a consulta do perfil trasfere busca a url no banco de dados e se flha fas tentativa novamente no redis e atualiza ele caso tenho algum dado inconsistente ao sempre que o usurio ler o qr code redis  serve para não sobre caregar o banco de dados no momento da leitura pais a url esta salva la so chama banco quando falha o  qstash deve ser nosso sitema defilas onde  quando somente o fluxo aconatcer é inseriod nafila ## External Services

- **MercadoPago** - Payment processing for Brazilian market
- **AWS SES** - Email service for notifications
- **QStash** - Async job processing
- **Upstash Redis** - Caching and session management 

      • Fluxo de dados end-to-end:
   3. MercadoPago ➡ `mercadopago-webhook` (não mostrado) ➡ cria objeto `WebhookProcessingData` e chama `enqueueProcessingJob`.
   4. QStash publica HTTP-POST → `final-processor`.
   5. `final-processor` processa pagamento, grava perfil, faz cache em Redis e chama `enqueueEmailJob`.
   6. QStash publica HTTP-POST → `email-sender`.
   7. `email-sender` valida assinatura, gera e envia email via SES.

3. Benefícios e pontos de atenção
   • Redis: acelera leituras (ex.: QR Code/memorial) e alivia Postgres; TTL previne dados obsoletos.
   • QStash: desacopla etapas críticas (pagamento → processamento → email) aumentando resiliência; retries automáticos cobrem falhas transitórias.
   • Segurança: todas as chamadas incluem `Authorization: Bearer` (producer) e verificação de assinatura (consumer), evitando spoofing.
   • Monitoramento: logs centralizados (`logInfo`, `logWarn`, `logError`) trazem `correlationId` para rastrear mensagens ponta-a-ponta.
Fluxo de Dados Detalhado:
   MercadoPago → webhook → enqueueProcessingJob()
   QStash → final-processor → processa pagamento
   final-processor → Redis Service → cache com TTL 24h
   final-processor → Supabase → salva perfil
   final-processor → QStash → enqueueEmailJob()
   QStash → email-sender → valida assinatura → envia email
  1. Criação de Perfil (Edge Functions):
    MercadoPago Webhook → Edge Function → Supabase DB + Redis Cache
    2. Leitura de Perfil (Vercel API):
    Frontend → Vercel API → Redis Cache → (fallback) Supabase DB 
        ┌─────────────────────────────────────────────────────────────┐
    │                        FRONTEND                             │
    │                     (React/Vite)                            │
    └─────────────────┬───────────────────┬───────────────────────┘
                      │                   │
                      ▼                   ▼
    ┌─────────────────────────────┐ ┌─────────────────────────────┐
    │        VERCEL APIs          │ │      SUPABASE EDGE          │
    │       (Node.js)             │ │      FUNCTIONS (Deno)       │
    ├─────────────────────────────┤ ├─────────────────────────────┤
    │ • create-payment ──────────┼─┼→ mercadopago-checkout       │
    │ • get-profile              │ │ • final-processor           │
    │ • check-status             │ │ • email-sender              │
    └─────────────────────────────┘ └─────────────────────────────┘
                      │                   │
                      ▼                   ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                 INFRAESTRUTURA COMPARTILHADA                │
    │  • Supabase Database  • Upstash Redis  • QStash Queue      │
    └─────────────────────────────────────────────────────────────┘
        ┌─────────────────────────────────────────────────────────────┐
    │                    INFRAESTRUTURA COMPARTILHADA             │
    ├─────────────────┬─────────────────┬─────────────────────────┤
    │   Supabase DB   │  Upstash Redis  │      QStash Queue       │
    └─────────────────┴─────────────────┴─────────────────────────┘
             ▲                   ▲                   ▲
             │                   │                   │
        ┌────┴────┐         ┌────┴────┐         ┌────┴────┐
        │ ESCRITA │         │ ESCRITA │         │ORQUESTRA│
        │         │         │         │         │         │
    ┌───▼─────────▼───┐ ┌───▼─────────▼───┐ ┌───▼─────────▼───┐
    │  EDGE FUNCTIONS │ │  VERCEL APIs    │ │   BACKGROUND    │
    │   (Deno/Supabase)│ │  (Node.js)      │ │   PROCESSES     │
    ├─────────────────┤ ├─────────────────┤ ├─────────────────┤
    │• final-processor│ │• get-profile    │ │• QStash jobs    │
    │• email-sender   │ │• create-payment │ │• Webhooks       │
    │• webhook        │ │• check-status   │ │• Retries        │
    └─────────────────┘ └─────────────────┘ └─────────────────┘
***lembrese que as imformação acima é de outro sistema mas segue boas pratica não usamos edfunctions do supsbase nosso projeto não usa supabase ams temso o mesmo fluxo acima mas precisamos de uma documentação que prioriza etapas de implementação lembrese de analisar por completo nosso chekout antes eramos direcionado para um chekout externo do mercado pago onde efetuamos o pagamento e eramos redirecionados para a pagina comforme o status do pagamento precisamos enteder que tipo de checkout estamos usando se é um checkout padrão ou um checkout customizado pois ele abre em um modal na mesma pagina e precisa de ajustes pois não conseguimos clicar no botão de pagar apos prencher os dados esse é um tipo de checkoupro tabem do mercado pago qual a diferença de performe para o que transfere para a pagina externa em comparação com esse o criador desse sitema disso que sta forma é recomendado pelo mercado pago vamos anlisar e documentar isso de forma analisando as pocibilidades de manter e de mudar mas mostrando os contra e pros 

✅ Configuração Final Implementada

  URLs do Sistema Atualizadas:

  # .env.local atualizado:
  FRONTEND_URL=
  VITE_FRONTEND_URL=

  Resultado das URLs Geradas:

  - ✅ QR Code conteúdo: 
  - ✅ Success page: 
  - ✅ Webhook: 
  - ✅ APIs: 

  Firebase Storage mantido:

  - ✅ Imagem QR: 

  🎯 Sistema Final

  Agora temos:
  1. Unificação total em memoryys.com
  2. QR Code aponta para memoryys.com/memorial/{id}
  3. Imagem PNG disponível via Firebase Storage para download
  4. Zero breaking changes - funcionalidade mantida
  5. Branding consistente - tudo memoryys.com
 Vou explicar exatamente como funciona a estrutura da URL do Firebase Storage:

● Read(api/create-payment.ts)
  ⎿  Read 25 lines (ctrl+r to expand)

● 🔍 Estrutura Detalhada da URL Firebase Storage

  Como funciona atualmente:

  // 1. Bucket configurado na inicialização:
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
  // Resultado: "moto-sos-guardian-app-78272.appspot.com"

  // 2. Caminho do arquivo:
  const fileName = `qr-codes/${profileId}.png`;
  // Exemplo: "qr-codes/550e8400-e29b-41d4-a716-446655440000.png"

  // 3. URL final gerada:
  ``
  // Resultado real:
  // 


● ✅ Implementação Completa - Firebase Storage para QR Codes

  🎯 O que foi implementado:

  1. Firebase Storage Integration

  - ✅ Adicionado getStorage do Firebase Admin
  - ✅ Configurado storageBucket na inicialização
  - ✅ Função uploadQRCodeToStorage() para upload de imagens