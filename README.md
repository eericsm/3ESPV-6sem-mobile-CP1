# chat SEIA

Aplicativo de chat em tempo real (conversas individuais e em grupo) desenvolvido
com React Native + Expo + TypeScript + Firebase, com notificações push entregues
por uma API própria.

## Descrição

O app permite cadastro e login exclusivamente por e-mail e senha. Usuários
autenticados podem conversar individualmente (1 para 1) ou criar/participar de
grupos com limite configurável de integrantes e política de notificação própria.
Mensagens são sincronizadas em tempo real via Firebase Realtime Database; perfis,
grupos e tokens de notificação ficam no Cloud Firestore. O envio de push é feito
por uma API Node.js própria (nunca pelo app diretamente), usando Firebase Cloud
Messaging.

## Tecnologias utilizadas

- React Native 0.86 + Expo SDK 57
- TypeScript (sem `any`)
- Firebase Authentication (e-mail/senha)
- Cloud Firestore
- Firebase Realtime Database
- Firebase Cloud Messaging (FCM)
- Cloudinary (fotos de perfil e de grupo)
- `expo-notifications`, `expo-image-picker`, `expo-dev-client`
- API própria: Node.js + Express + TypeScript (`server/`)

## Versão do Expo

- Expo SDK: `^57`
- React Native: `0.86.3`

> Push remoto não é suportado no Expo Go. É necessário um **development build**
> (`npx expo run:android` ou `npx expo run:ios`, ou um build EAS) para testar
> notificações. O restante do app funciona normalmente no Expo Go.

## Serviços Firebase utilizados e responsabilidade de cada um

| Serviço | Responsabilidade |
|---|---|
| **Firebase Authentication** | Cadastro e login por e-mail/senha, recuperação de sessão, logout. |
| **Cloud Firestore** | Perfis de usuário (público `users/{uid}` + privado `users/{uid}/private/profile`), grupos e seus metadados (`groups/{id}`), conversas diretas (`directConversations/{id}`), tokens de dispositivo (`users/{uid}/devices/{deviceId}`), e idempotência de notificações (`processedMessages/{messageId}`, usado só pela API). |
| **Realtime Database** | Mensagens (`messages/{conversationId}/{messageId}`) e os espelhos de membership usados pelas regras (`conversationMembers`, `groupOwners`) |
| **Firebase Cloud Messaging** | Envio de notificações push, disparado exclusivamente pela API (`server/`), nunca pelo app. |

> Fotos de perfil/grupo **não** usam Firebase Storage — ver "Armazenamento de
> fotos" abaixo para o porquê e o serviço escolhido.

## Pré-requisitos

- Node.js 22.13+ (exigido pelo Expo SDK 57)
- npm
- Expo CLI (`npx expo ...`, não precisa instalar globalmente)
- Para o fluxo **sem push**: dispositivo físico (ou emulador) com o app **Expo
  Go**, ou um development build.
- Para testar **push**: um development build num device físico Android. Não é
  necessário Android Studio/SDK instalado localmente, o build é feito na nuvem
  pelo **EAS Build** (ver "Configuração das notificações" abaixo).

## Instruções de instalação e execução (app)

```bash
npm install
npx expo start
```

O `.env` do app já vem commitado no repositório com valores reais, nada nele é
secreto (Cloudinary cloud name/preset são públicos por design; a URL da API de
notificações também não é sensível). Isso é intencional, para que o projeto
rode com `npm install` sem configuração extra. Só `EXPO_PUBLIC_NOTIFICATIONS_API_URL`
precisa ser atualizado após o deploy da API (ver seção da API abaixo), sem
isso, o app funciona normalmente, só não dispara push.

Escolha rodar no Android, iOS ou Web pelo menu do `expo start`, isso usa o
Expo Go e cobre login, cadastro, conversas diretas e grupos. Para testar
**notificações push**, é necessário um development build (ver seção abaixo).

## Configuração do Firebase

O arquivo `firebaseConfig.json`, na raiz do repositório, contém a configuração
pública do SDK cliente (não é um segredo administrativo) e é lido por
`src/services/firebase.ts`. O projeto Firebase (`mobile-6sem-cp1`) já está
configurado com Authentication (e-mail/senha), Cloud Firestore e Realtime
Database, e as regras deste repositório (`firestore.rules`,
`database.rules.json`) já foram publicadas nele — nenhuma configuração
adicional é necessária para rodar o projeto como está.

Para rodar contra outro projeto Firebase (ex.: outra conta), os passos são:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Ative **Authentication** (e-mail/senha), **Cloud Firestore**, **Realtime
   Database** e **Cloud Messaging**.
3. Copie as credenciais do app Web para `firebaseConfig.json` (mesmo formato já
   presente no arquivo).
4. `npx firebase-tools login` → `npx firebase-tools use --add` (selecione o
   novo projeto) → publique as regras:

   ```bash
   npx firebase-tools deploy --only firestore:rules,database
   ```

   `firebase.json`, `.firebaserc` e `firestore.indexes.json` (gerados pelo
   `firebase init`) já estão no repositório e não contêm segredos.

### Armazenamento de fotos

**Firebase Storage não é usado neste projeto**, desde o final de 2024 ele
passou a exigir o plano pago (Blaze), mesmo para uso dentro da cota gratuita, e
a equipe optou por não vincular um cartão de crédito.

Fotos de perfil e de grupo são enviadas para o **Cloudinary** (free tier, sem
necessidade de cartão), via upload direto do app usando um
["unsigned upload preset"](https://cloudinary.com/documentation/upload_images#unsigned_upload):
nenhum segredo fica no cliente, o preset só autoriza criação de novos arquivos.
Apenas a URL final (`secure_url`) é salva no Firestore, nunca a imagem em
Base64. Configuração (`src/services/imageUploadService.ts`):

- `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` e `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
  no `.env` da raiz (já preenchidos com os valores da conta usada pela equipe,
  já que não são segredos).
- Para usar outra conta: crie uma em [cloudinary.com](https://cloudinary.com)
  (grátis, sem cartão) → Settings → Upload → Upload presets → novo preset com
  **Signing Mode = Unsigned** → copie o cloud name (topo do dashboard) e o nome
  do preset para o `.env`.

## Configuração das notificações (Android/iOS)

- O app usa `expo-notifications` só para pedir permissão, criar o canal Android
  e capturar o **token nativo do dispositivo** (`getDevicePushTokenAsync`, que no
  Android é o token FCM real), salvo em
  `users/{uid}/devices/{deviceId}` no Firestore.
- O disparo do push em si é feito pela API (`server/`) via Firebase Admin SDK,
  o app nunca chama `admin.messaging()` nem guarda credencial administrativa.
- Push **não funciona no Expo Go**; é necessário um development/standalone
  build, como descrito abaixo.

### Android

O app Android já está registrado no projeto Firebase (pacote
`com.chatseia.app`) e o `google-services.json` correspondente já está na raiz
do repositório (referenciado em `app.json` → `android.googleServicesFile`),
nenhuma configuração extra é necessária para quem for buildar este repositório.

Como nem todo mundo tem Android Studio/SDK instalado, o build é feito na nuvem
pelo **EAS Build** (gratuito, sem necessidade de ambiente nativo local):

```bash
npm install -g eas-cli
eas login                                   # conta Expo/EAS (gratuita)
eas build --platform android --profile preview
```

Isso gera um `.apk` standalone (perfil `preview`, configurado em `eas.json`) e,
ao final, imprime uma URL/QR code para baixar e instalar diretamente no
celular (é preciso permitir "instalar de fontes desconhecidas" no Android). Com
Android Studio/SDK instalado localmente, `npx expo run:android` também funciona
como alternativa.

### iOS

Push remoto exige conta Apple Developer paga, certificado/chave APNs
configurada no projeto Firebase (Cloud Messaging → APNs Auth Key) e um
development build (`npx expo run:ios` ou `eas build --platform ios`). Em
simulador iOS, push remoto não funciona, só em device físico. Este projeto
não tem o app iOS registrado no Firebase; quem quiser testar em iOS precisa
repetir o registro (Project settings → Add app → iOS) e gerar o
`GoogleService-Info.plist`.

## API de notificações (`server/`)

### Tecnologia

Node.js + Express + TypeScript. Usa o **Firebase Admin SDK** para validar o ID
token do usuário e enviar notificações via FCM. Não usa Cloud Functions.

### Fluxo

1. O app persiste a mensagem no Realtime Database.
2. O app chama `POST /notifications/messages` com `conversationId` e
   `messageId`, autenticado com `Authorization: Bearer <firebase-id-token>`.
3. A API valida o token com o Admin SDK, confirma no Realtime Database que a
   mensagem existe e que `senderId` é o usuário autenticado.
4. A API verifica se a mensagem já foi processada (`processedMessages/{messageId}`
   no Firestore, escrito dentro de uma transação), se já foi, responde sem
   reenviar (idempotência contra chamadas duplicadas).
5. A API consulta no Firestore o tipo de conversa:
   - **direta** (`directConversations/{id}`): destinatário é o outro
     participante.
   - **grupo** (`groups/{id}`): destinatários dependem da
     `notificationPolicy` do grupo (ver abaixo).
6. A API busca os tokens de dispositivo habilitados dos destinatários
   (`users/{uid}/devices`) e envia via
   `admin.messaging().sendEachForMulticast`. Tokens inválidos/não registrados
   são automaticamente desativados no Firestore.

Os destinatários **nunca** são recebidos do app, são sempre recalculados no
servidor a partir do Firestore/Realtime Database oficiais.

### Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Health check — retorna `200 { "status": "ok" }`. |
| `POST` | `/notifications/messages` | Dispara a notificação de uma mensagem já persistida. Corpo: `{ "conversationId": string, "messageId": string }`. Header: `Authorization: Bearer <firebase-id-token>`. |

### Como rodar localmente

```bash
cd server
npm install
cp .env.example .env   # preencha com as credenciais da conta de serviço
npm run dev
```

### Como publicar (Render, free tier)

1. Crie um "Web Service" no [Render](https://render.com) apontando para a pasta
   `server/` deste repositório.
2. Build command: `npm install && npm run build`. Start command: `npm start`.
3. Configure as variáveis de ambiente do serviço (nunca commitadas):
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (cole a chave privada da conta de serviço;
     mantenha as quebras de linha como `\n`)
   - `FIREBASE_DATABASE_URL`
4. Deploy. A URL pública gerada pelo Render (ex.:
   `https://chat-seia-notifications-api.onrender.com`) deve ser configurada em
   `EXPO_PUBLIC_NOTIFICATIONS_API_URL` no `.env` do app.

### URL pública da API

**`https://threeespv-6sem-mobile-cp1.onrender.com`**

Health check: `GET https://threeespv-6sem-mobile-cp1.onrender.com/health` →
`200 { "status": "ok" }`.

> O serviço está no plano free do Render, que hiberna após ~15 min sem
> requisições, a primeira chamada depois de um período ocioso pode demorar
> uns 30-50s (cold start) antes de responder. Chamadas seguintes são rápidas.

### Credenciais administrativas

A conta de serviço (Firebase Admin SDK) é configurada **somente** nas
variáveis de ambiente do serviço de hospedagem (Render), nunca no app nem no
repositório Git. O arquivo `server/.env.example` documenta apenas os **nomes**
das variáveis necessárias, com valores fictícios.

## Explicação da política de notificação

Cada grupo tem um campo `notificationPolicy` (editável só pelo proprietário):

- `all_group_messages`: todos os integrantes (exceto o remetente) recebem push
  em toda mensagem geral do grupo.
- `mentioned_members`: só quem foi mencionado/selecionado como destinatário
  (`mentionedUserIds` da mensagem) recebe push.
- `direct_messages_only`: mensagens do grupo nunca geram push; só conversas
  diretas notificam.
- `disabled`: nenhuma mensagem da conversa gera push.

Conversas diretas não têm política configurável: o outro participante é sempre
notificado (exceto o próprio remetente). Em todos os casos, o remetente nunca
recebe notificação da própria mensagem, e a lista de destinatários é sempre
recalculada no servidor (nunca enviada pelo app).

## Explicação da proteção contra concorrência do limite de grupo

A proteção existe em duas camadas independentes, como o enunciado exige
("interface **e** regras do banco ou API"):

1. **Interface**: `GroupFormScreen` mostra quantas vagas restam e bloqueia o
   envio com limite inválido antes mesmo de chamar o backend.
2. **Transação no app** (`groupService.addMember`): usa `runTransaction` do
   Firestore, lê o documento do grupo dentro da transação, confere
   `memberIds.length < memberLimit` e só então grava o novo integrante. As
   transações do Firestore são otimistas: se duas pessoas tentarem entrar ao
   mesmo tempo no último slot disponível, o Firestore detecta o conflito de
   leitura e repete automaticamente a transação perdedora, que na nova
   tentativa lê o estado já atualizado e falha a checagem de capacidade.
3. **Regra do Firestore** (`firestore.rules`, `match /groups/{groupId}`): toda
   escrita (`create` ou `update`) ao documento do grupo exige
   `memberIds.size() <= memberLimit`, independentemente de qual código a
   originou. Essa é a camada que realmente não pode ser contornada, mesmo que
   alguém ignore `groupService.addMember` e escreva direto pelo SDK, o
   Firestore rejeita a escrita se ela ultrapassar o limite. Como consequência,
   essa mesma regra também impede reduzir `memberLimit` para um valor menor que
   a quantidade atual de integrantes.

Juntas, essas três camadas garantem que o grupo nunca excede `memberLimit`,
mesmo sob requisições concorrentes, sem depender apenas de desabilitar botões
na interface.

## Regras de segurança

- `firestore.rules`: perfis público/privado (ver seção acima), conversas
  diretas e grupos só legíveis por quem participa, `groups` só editável pelo
  proprietário e sempre com `memberIds.size() <= memberLimit` (ver seção de
  concorrência acima), `processedMessages` bloqueado para o cliente (só a API
  o usa via Admin SDK, que ignora regras).
- `database.rules.json`: mensagens só legíveis/graváveis por quem está marcado
  em `conversationMembers/{conversationId}/{uid}`; esse espelho só pode ser
  escrito pelo próprio uid (auto-registro ao abrir a conversa) ou pelo
  proprietário do grupo (identificado por `groupOwners/{groupId}`, gravado uma
  única vez na criação do grupo), isso permite remover o acesso de um
  integrante removido imediatamente. Mensagens são imutáveis
  (`!data.exists()` no `.write`) e o `senderId` deve ser o autor autenticado.
- Fotos (Cloudinary) não passam pelas regras do Firebase, a proteção ali é o
  "unsigned upload preset" (só permite criar arquivos novos, não ler/listar/
  apagar o restante da conta).

### Decisão documentada: validação cruzada Firestore ↔ Realtime Database

Como perfis/grupos vivem no Firestore e mensagens no Realtime Database, nenhum
dos dois consegue ler o outro dentro das próprias regras de segurança. Por isso:

- o app mantém espelhos mínimos e não sensíveis no Realtime Database
  (`conversationMembers`, `groupOwners`) só para as regras de mensagens
  decidirem acesso sem precisar ler o Firestore;
- a API, antes de enviar qualquer push, **revalida tudo direto nas fontes
  oficiais** (Realtime Database para a mensagem, Firestore para
  participantes/política), ela nunca confia nos espelhos nem em dados vindos
  do app.

## Estrutura do projeto

```text
.
├── app.json
├── App.tsx
├── firebaseConfig.json
├── firestore.rules
├── firestore.indexes.json
├── database.rules.json
├── firebase.json
├── .firebaserc
├── google-services.json
├── eas.json
├── .env
├── .env.example
├── src/
│   ├── components/
│   │   ├── Avatar.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ConversationItem.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── GroupMemberItem.tsx
│   │   ├── Loading.tsx
│   │   └── UserItem.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   └── useNotifications.ts
│   ├── screens/
│   │   ├── ChatScreen.tsx
│   │   ├── ConversationsScreen.tsx
│   │   ├── GroupFormScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   └── UsersScreen.tsx
│   ├── services/
│   │   ├── authService.ts
│   │   ├── chatService.ts
│   │   ├── firebase.ts
│   │   ├── groupService.ts
│   │   ├── imageUploadService.ts
│   │   ├── notificationService.ts
│   │   └── userService.ts
│   ├── types/
│   │   ├── chat.ts
│   │   ├── group.ts
│   │   ├── notification.ts
│   │   └── user.ts
│   └── utils/
│       ├── conversationId.ts
│       ├── groupValidation.ts
│       └── imagePicker.ts
└── server/
    ├── .env.example
    └── src/
        ├── app.ts
        ├── middleware/authenticate.ts
        ├── routes/{health,notifications}.ts
        ├── services/{firebaseAdmin,notificationSender,recipientResolver}.ts
        └── types.ts
```

## Prints da aplicação

<img width="738" height="1600" alt="img" src="https://github.com/user-attachments/assets/ebc3c6b3-c815-4040-bc67-47a5cce5f7d7" />
<img width="738" height="1600" alt="img(6)" src="https://github.com/user-attachments/assets/860c363e-1917-44f6-9232-5c855ee9ca8e" />
<img width="738" height="1600" alt="img(5)" src="https://github.com/user-attachments/assets/6cc31eb1-7a5d-4c91-b6e3-baa1dcb5fb29" />
<img width="738" height="1600" alt="img(4)" src="https://github.com/user-attachments/assets/6ad1cb59-8718-4e73-9df8-50528d18dd04" />
<img width="738" height="1600" alt="img(3)" src="https://github.com/user-attachments/assets/a700ccbe-6543-44cf-950e-bae71ad4ec63" />
<img width="738" height="1600" alt="img(2)" src="https://github.com/user-attachments/assets/2aeccba4-6af3-48fa-b122-278d6a38fa76" />
<img width="738" height="1600" alt="img(1)" src="https://github.com/user-attachments/assets/c1b5a11f-156b-4e66-8364-72102bee18d2" />


## Evidência de notificação


https://github.com/user-attachments/assets/97009373-2b2b-442f-8447-9723694a2706



## Observações

- Autenticação é exclusivamente por e-mail e senha — não há login com Google,
  Apple, contas anônimas ou usuários hardcoded.
- Zero uso de `any` no código TypeScript do app e da API.

## Integrantes

- RM557948 — Joao Victor Oliveira dos Santos
- RM558193 — Matheus Alcântara Estevão
- RM558610 — Nicolle Pellegrino Jelinski
- RM552047 — Pedro Pereira dos Santos
- RM558224 — Eric Segawa Montagner
