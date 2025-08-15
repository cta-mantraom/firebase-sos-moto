Inicialização comum
Para configurar a integração dos Bricks e ter um checkout responsivo, otimizado e configurável, disponibilizamos nos passos abaixo o processo de configuração inicial comum para todos os Bricks.

Incluir biblioteca Mercado Pago
Client-Side

Utilize as nossas bibliotecas oficiais para acessar as funcionalidades do Mercado Pago com segurança desde seu frontend.

npm install @mercadopago/sdk-react
Inicializar biblioteca Mercado Pago
Em seguida, inicialize a biblioteca Mercado Pago para utilizar Checkout Bricks.

import { initMercadoPago } from '@mercadopago/sdk-react';
initMercadoPago('YOUR_PUBLIC_KEY');