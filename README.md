# 🐍 Cobrinha Neon

Jogo da cobrinha moderno para web (HTML/CSS/JS puro, sem dependências), com tabuleiro escuro,
animações leves e suporte completo a desktop e dispositivos móveis.

## Funcionalidades
- **Controles de teclado**: setas ou WASD para mover, `Espaço` para pausar/iniciar, `R` para reiniciar.
- **Controles de toque**: swipe no tabuleiro + D-pad na tela (exibido apenas em dispositivos de toque).
- **Pausa** (botão, tecla Espaço e pausa automática ao trocar de aba) e **reinício** a qualquer momento.
- **4 níveis de dificuldade** (Fácil, Médio, Difícil, Insano) — a escolha é salva no navegador.
- **Pontuação atual e recorde** persistentes via `localStorage`, com destaque para novo recorde.
- **Visual neon escuro** com gradientes, brilho, comida pulsante, movimento interpolado suave,
  olhos na cabeça da cobra e tremor de tela no game over. Canvas com suporte a HiDPI/retina.

## Como jogar
Abra `index.html` no navegador, ou sirva a pasta localmente:

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```

## Arquivos
| Arquivo      | Descrição                          |
|--------------|------------------------------------|
| `index.html` | Estrutura da página e HUD          |
| `style.css`  | Tema escuro, animações e responsivo|
| `game.js`    | Lógica do jogo, render e controles |
