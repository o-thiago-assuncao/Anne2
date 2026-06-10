
# Clone do funil "Madame Anne" — Nexus Software Solutions

Recriar a página `nexus-software.solutions/anne` como uma experiência de chat tipo Typebot (estilo WhatsApp) em francês, com mensagens sequenciais, áudios, imagens, botões de escolha e inputs de texto/data/email.

## Escopo visual

- Header rosa/magenta (`#a8155f` aprox.) com avatar circular da "Madame Anne", nome **Madame Anne** e status `● online`. Ícones à direita: telefone, link, menu (3 pontos). Botão voltar à esquerda.
- Corpo escuro vinho/quase preto (`#1a0a14` aprox.), bolhas de mensagem brancas vindas da esquerda, com o avatar pequeno antes de cada bloco.
- Bolhas do usuário à direita (cinza claro/branco translúcido).
- Animação "..." (3 pontos) enquanto a próxima mensagem é "digitada".
- Mensagens entram com leve fade/slide e atraso (efeito digitando).
- Layout responsivo, mobile-first (a página original é otimizada para mobile).

## Fluxo de conversa (capturado interagindo com a página real)

1. **Splash:** "⌛️ Votre chat commence !" → "Madame Anne est en train de se connecter..."
2. Mensagens iniciais da Anne (apresentação, promessa do desenho da alma gêmea, aviso emocional).
3. **Input texto** — "Avant de commencer, pourriez-vous me dire votre nom ?" → captura `nom`.
4. Reação personalizada com o nome + explicação do procedimento.
5. **Áudio** (player customizado: play/pause, scrubber, volume, mute, mais opções).
6. **Botão único:** "Oui, je suis prêt !" + aviso "⚠️ Ne croisez pas les bras ni les jambes."
7. **Input data** — "Quelle est votre date de naissance ?" (formato JJ/MM/AAAA).
8. **Input texto** — "À quelle heure êtes-vous né ?".
9. **Múltipla escolha** — "Comment va ta vie amoureuse ?":
   - Je suis dans une relation sérieuse.
   - Je fais connaissance avec quelqu'un.
   - Je suis célibataire pour le moment !
10. Reação personalizada (signo calculado a partir da data, ex.: "Gémeaux").
11. **Áudio** com depoimento.
12. Bloco de **imagens** (testemunhos): "Olivia" e "Claire" com legendas de sucesso.
13. **Botão único:** "✅ OUI, JE VEUX QUE VOUS DESSINIEZ MON ÂME SŒUR !"
14. Sequência de "carregamento": "Marie...", "Gémeaux...", "Né le 15/06/1990...", "⌛️ Je regarde votre thème astral..." com áudio.
15. **Input email** — "Quelle est la meilleure adresse e-mail à laquelle je peux t'envoyer ton dessin ?".
16. Mensagem final + áudio "Marie, vous êtes sur le point de vivre un moment très spécial..." (provável CTA/upsell para pagamento — manter como mensagem final genérica + placeholder de CTA).

## Arquitetura técnica

Rotas (TanStack Start, file-based em `src/routes/`):
- `index.tsx` — landing simples com botão "Commencer le chat" → link para `/anne`.
- `anne.tsx` — a experiência de chat completa.

Componentes em `src/components/chat/`:
- `ChatHeader.tsx` — header magenta com avatar, nome, status, ícones (lucide-react).
- `ChatContainer.tsx` — orquestrador do fluxo. Mantém estado: `step`, `answers` (nome, data nasc., hora, status, email), `messages` renderizadas.
- `MessageBubble.tsx` — bolha (variants: bot/user, com/sem avatar).
- `TypingIndicator.tsx` — animação dos 3 pontos.
- `AudioMessage.tsx` — player customizado (play/pause, barra de progresso, volume, mute).
- `ImageMessage.tsx` — bolha com imagem + legenda.
- `ChoiceButtons.tsx` — botões de escolha múltipla empilhados.
- `TextInput.tsx`, `DateInput.tsx`, `EmailInput.tsx` — inputs com placeholder + botão "Envoyer".

Dados do fluxo em `src/data/anne-flow.ts`:
- Array tipado `FlowStep[]` (discriminated union: `bot-text`, `bot-audio`, `bot-image`, `ask-text`, `ask-date`, `ask-email`, `ask-choice`, `ask-button`).
- Cada step tem `delayMs` (tempo de "digitando") e suporta interpolação `{nom}`, `{signe}` (calculado da data).

Lógica:
- Hook `useChatFlow(steps)` avança automaticamente em mensagens do bot, espera resposta em steps de input.
- Função `getZodiacSign(dateString)` para derivar signo em francês.

## Design system (`src/styles.css`)

Adicionar tokens em `oklch`:
- `--chat-header`: magenta vibrante (~oklch(0.45 0.18 0))
- `--chat-bg`: vinho escuro (~oklch(0.18 0.05 350))
- `--chat-bubble-bot`: branco
- `--chat-bubble-user`: branco translúcido
- `--chat-text-bot`: quase preto
- Fonte system-ui / sans-serif limpa.

## Assets

- Avatar de "Madame Anne" — gerar imagem (premium) de uma mulher loira meia-idade, retrato amigável, fundo neutro.
- 2 imagens de "testemunhos" (Olivia, Claire) — gerar.
- Áudios: usar 3 arquivos de áudio placeholder curtos (silêncio ou TTS local opcional). Como áudio real do funil não pode ser baixado eticamente, gerar via Web Speech API no client OU usar arquivos vazios com duração fictícia. **Decisão padrão:** placeholder visual do player com duração fake, sem áudio real (pode-se trocar depois).

## Idioma

Tudo em **francês**, idêntico aos textos capturados.

## Não incluído

- Pagamento/Stripe (a página original termina num upsell — fica fora do clone).
- Backend: tudo client-side, sem persistência.
- Tracking/analytics da página original.

## Entrega

Após implementação, a rota `/anne` reproduz o funil completo, e `/` tem CTA para iniciá-lo.
