# Evoluções do Pet Tigrinho — guia e prompts dos sprites

Este guia tem duas partes. **No jogo** são as formas implementadas hoje, com o
prompt de cada sprite. O **catálogo completo** no fim guarda as 52 formas do
design original; as marcadas com ✅ são as que estão no jogo, e as outras
ficam como ideia para depois.

## No jogo

14 formas em 5 linhas de 3 estágios, saindo de 4 ovos. O Ovo Azul é o único
que ramifica: no Nv. 16 o Gotigre vira Tigre d'Água ou Neviger, conforme os
status.

🎨 = sprite pronto.

| Ovo | Base (Comum) | Nv. 16 (Raro) | Nv. 36 (Lendário) |
|---|---|---|---|
| Branco | Tigrin 🎨 | Estreliger | Tigre Cósmico 🎨 |
| Vermelho | Brasinha | Tigre-Fornalha | Mechatigre |
| Azul | Gotigre | Tigre d'Água 🎨 | Tigre-Leviatã |
| Azul | ″ | Neviger | Tigre-Glacial |
| Verde | Folhiger | Floriger | Tigre-Yggdrasil |

Fonte da verdade dos dados: [`src/js/forms.js`](../src/js/forms.js). Se mudar
algum requisito lá, atualize aqui também.

### Regra do Ovo Azul (Nv. 16)

No Nv. 16 o Gotigre vira Água ou Gelo conforme os status naquele momento:

| Rota | Requisito |
|---|---|
| Tigre d'Água | Felicidade ≥ 70% |
| Neviger | Sabedoria ≥ 60% **e** Saúde ≥ 60% |

Cada rota tem uma **folga**: quanto o status *mais fraco* que ela pede passou
do requisito (ou quanto faltou, se for negativo). **Vence a maior folga.**

- **Só uma rota cumprida:** ela vence.
- **As duas cumpridas:** vence a que passou por mais. Ex.: Felicidade 95%,
  Sabedoria 65%, Saúde 70% → Água tem folga +25, Gelo +5 → **Tigre d'Água**.
  Felicidade 72%, Sabedoria 85%, Saúde 90% → Água +2, Gelo +25 → **Neviger**.
- **Nenhuma cumprida:** vence a que chegou mais perto.
- **Empate:** vence Tigre d'Água (a primeira listada em `forms.js`).

Nada é sorteado: os mesmos status sempre dão a mesma forma, e a tela de
informações (ⓘ) mostra ao vivo para qual forma o pet evoluiria agora. As
outras linhas evoluem direto, sem escolha.

---

## Fluxo: do ChatGPT pro jogo

Sem API: as imagens saem da interface web do ChatGPT e o resto é automático.
É a mesma receita que gerou o Tigrin, o Tigre d'Água e o Tigre Cósmico:
**gerar → tirar o fundo → sintetizar**, sempre partindo da imagem anterior
na mesma conversa.

### Conversas

Uma conversa por linha, na ordem indicada. O ChatGPT mantém o estilo muito
melhor quando cada forma sai da imagem anterior da mesma conversa.

| Conversa | Anexe no início | Ordem |
|---|---|---|
| Cósmica | `tigrin.png` + `tigre-cosmico.png` | Estreliger |
| Fogo | `tigrin.png` | Brasinha → Tigre-Fornalha → Mechatigre |
| Azul / Gelo | `tigrin.png` + `tigre-dagua.png` | Gotigre → Neviger → Tigre-Glacial |
| Água | `tigre-dagua.png` | Tigre-Leviatã |
| Grama | `tigrin.png` | Folhiger → Floriger → Tigre-Yggdrasil |

Os PNGs ficam em `assets/source/`; é só arrastar para o ChatGPT.

### Para cada forma: 3 mensagens

Selecione a ferramenta **Criar imagem** do ChatGPT na primeira mensagem.

1. **Gerar** — a primeira forma da conversa leva o *bloco de estilo* + o
   prompt da forma. As seguintes levam só o prompt da forma: ela sai da
   última imagem gerada.
2. **Tirar o fundo:**

   ```text
   Good job. Now take this last tiger and remove the background, make the
   background transparent.
   ```

3. **Sintetizar** (menos detalhe, para ler bem no celular):

   ```text
   Now add synthesis to this last image: less detail, fewer small
   elements, flatter shading, cleaner and bolder shapes. Keep the same
   character, pose and colors, and keep the background transparent.
   ```

Se a imagem vier com algo a mais (cartas, moedas, letras), junte na
mensagem 2: *"Remove the playing cards."* Se o resultado ficar ruim, não
insista no mesmo texto: peça uma alteração pontual sobre a imagem (*"make
the fur of this latest image green"*) — foi assim que o Tigre d'Água saiu.

### Pro jogo

1. **Baixe o PNG final** (o da mensagem 3) e salve como
   `assets/source/<id>.png` (o id está no título de cada forma).
2. **Rode:**

   ```sh
   python3 tools/sprites.py
   ```

   Ele recorta, redimensiona para 900px, grava `assets/pet/<id>.webp`, liga o
   sprite no jogo (`src/js/sprites.js`) e lista o que ainda falta.

**Se o fundo não vier transparente** (o script avisa): repita a mensagem 2
ou rode `python3 tools/sprites.py --knockout`. O knockout só apaga o fundo
ligado às bordas; um buraco branco fechado (entre a cauda e o corpo, por
exemplo) continua branco.

**Se o pet ficar pequeno ou grande demais na tela:** passe `scale` na forma
em `forms.js` (largura do sprite em % da tela; padrão 62 / 78 / 84 por
raridade).

### Bloco de estilo (primeira mensagem de cada conversa)

```text
Create an image. Use the attached "tigrin.png" as the reference for the
art style. The character must be a young tiger cub, cute and small, super
kawaii, with the same colors and aesthetics as the reference: thick dark
outlines, clean cel shading, big glossy eyes, small fangs, happy open
mouth, full body in a dynamic jumping 3/4 pose. Nothing else should be on
the screen: no letters, no text, no playing cards, no coins, no frame, no
ground, no scenery. Effects around the body (water, flames, stars) may
extend outside the silhouette. Avoid pure red on the body unless it is a
fire form, because the game background is lacquer red and gold.
```

Regra visual: quanto mais avançada a forma, maior o porte e mais elaborados
os ornamentos e os efeitos. O Lendário é o mais imponente da linha, mas
continua fofo e kawaii — nada assustador.

---

## 1. Ovo Branco — linha Cósmica

### Tigrin · `tigrin` · Normal · Comum 🎨
Filhote laranja listrado, com colete vermelho e dourado. Sprite pronto.

### Estreliger · `estreliger` · Normal/Cósmico · Raro
Conversa Cósmica · primeira mensagem (com o bloco de estilo)

```text
Evolve the attached Tigrin into its middle stage, halfway to the attached
"tigre-cosmico.png", which is its final form. Slightly bigger and more confident than Tigrin. Fur
shifting from orange to deep navy at the paws and tail tip, stripes
starting to glow gold like constellations, a few small gold four-pointed
stars orbiting the body, a small star mark on the forehead, eyes with a
star sparkle. Keeps a simpler version of the red-and-gold vest. Less
cosmic than the final form: no planets, no galaxy tail yet.
```

### Tigre Cósmico · `tigre-cosmico` · Normal/Cósmico · Lendário 🎨
Galáxia na cauda, planetas em órbita. Sprite pronto.

---

## 2. Ovo Vermelho — linha Fogo/Metálico

### Brasinha · `brasinha` · Fogo · Comum
Conversa Fogo · primeira mensagem (com o bloco de estilo)

```text
A fire-type variant of the attached Tigrin, same size and age (base
form). Warm orange-amber fur with dark brown stripes, tail tip and ear
tufts glowing like embers, a few tiny sparks floating around. No vest.
Energetic, playful expression. Use orange and amber, not pure red.
```

### Tigre-Fornalha · `tigre-fornalha` · Fogo/Metálico · Raro
Conversa Fogo · depois do Brasinha

```text
Take this last tiger (Brasinha) and evolve it into its middle stage. Bigger and sturdier.
Wears armour of hot iron: riveted dark-grey plates on shoulders, chest
and legs, the joints glowing orange from heat inside. A small chimney on
its back puffing light smoke. Ember-tipped tail. Proud, cheerful
expression.
```

### Mechatigre · `mechatigre` · Fogo/Metálico · Lendário
Conversa Fogo · depois do Tigre-Fornalha

```text
Take this last tiger (Tigre-Fornalha) and evolve it into its final, legendary form: a
robot tiger of polished steel and gunmetal with gold trim, a visible
glowing fire core in its chest, amber LED eyes, segmented mechanical
tail with a flame at the tip, small jet flames from the paws. Still cute
and friendly, chibi proportions, not menacing. The most impressive of
the fire line.
```

---

## 3. Ovo Azul — linhas Água e Gelo

### Gotigre · `gotigre` · Água · Comum
Conversa Azul / Gelo · primeira mensagem (com o bloco de estilo)

```text
A water-type variant of the attached Tigrin, same size and age (base
form). Light sky-blue fur with navy stripes, tail ending in the shape of
a water drop, a couple of small bubbles around. No vest. Gentle, sweet
expression. Simpler and younger than the attached "tigre-dagua.png",
which is what it evolves into.
```

### Tigre d'Água · `tigre-dagua` · Água · Raro 🎨
Pelagem verde-água, ondas na cauda e gotas flutuando. Sprite pronto.

### Tigre-Leviatã · `tigre-leviata` · Água · Lendário
Conversa Água · primeira mensagem (com o bloco de estilo, trocando
"tigrin.png" por "tigre-dagua.png")

```text
Evolve the attached Tigre d'Água into its final, legendary form: a sea
dragon tiger. Long, slightly serpentine body, deep ocean-blue fur with
teal stripes, fins on the elbows and a fin crest along the back, pearly
scales on the chest, a long tail ending in a large fin, swirling ocean
waves and droplets around. Majestic but still cute. The most impressive
of the water line.
```

### Neviger · `neviger` · Água/Gelo · Raro
Conversa Azul / Gelo · depois do Gotigre

```text
Take this last tiger (Gotigre) and evolve it into its ice middle stage. Bigger. The water
in its body has frozen into armour of clear, faceted ice crystals on the
shoulders, back and tail. White fur with pale icy-blue stripes, frosty
breath puffing from the mouth, a few snowflakes around. Calm, confident
expression.
```

### Tigre-Glacial · `tigre-glacial` · Água/Gelo · Lendário
Conversa Azul / Gelo · depois do Neviger

```text
Take this last tiger (Neviger) and evolve it into its final, legendary form: a large
glacier tiger with a crown of icicles, thick white-and-silver fur, ice
crystal armour on the chest and legs, frost spreading from its paws,
snowflakes and ice shards swirling around. Regal and calm, still cute.
The most impressive of the ice line.
```

---

## 4. Ovo Verde — linha Grama

### Folhiger · `folhiger` · Grama · Comum
Conversa Grama · primeira mensagem (com o bloco de estilo)

```text
A grass-type variant of the attached Tigrin, same size and age (base
form). Light olive-green fur with dark green stripes, a mane of leaves
around the head, a small sprout at the tail tip. No vest. Sunny, happy
expression.
```

### Floriger · `floriger` · Grama/Fada · Raro
Conversa Grama · depois do Folhiger

```text
Take this last tiger (Folhiger) and evolve it into its middle stage. Bigger and more
graceful. Exotic flowers in pink, yellow and white bloom in its leafy
mane, a flower at the tail tip, loose petals floating in the air around
it. Joyful, gentle expression.
```

### Tigre-Yggdrasil · `tigre-yggdrasil` · Grama/Fada · Lendário
Conversa Grama · depois do Floriger

```text
Take this last tiger (Floriger) and evolve it into its final, legendary form: a whole
small tree grows from its back, with a glowing green canopy and tiny
lights like fireflies, roots wrapping its paws, moss and flowers on its
fur, bark-like patterns along the stripes. Ancient and wise but still
cute. The most impressive of the grass line.
```

---

## Catálogo completo (design original, 52 formas)

✅ = está no jogo. As demais **não estão ligadas no código** e ficam aqui como
referência para versões futuras. Para trazer uma de volta, adicione-a em
`src/js/forms.js` e marque-a aqui.

Diferenças entre o catálogo e o jogo atual:

- A linha cósmica (Tigrin → **Estreliger** → **Tigre Cósmico**) e o **Tigre
  d'Água** são novos e não aparecem no catálogo.
- No jogo, o Tigre d'Água ocupa o lugar do Coraliger: o Tigre-Leviatã vem
  dele e é do tipo Água (no catálogo, Água/Fada via Coraliger).
- No jogo, as linhas sem ramificação evoluem direto; os requisitos de
  "Favorece" do Nv. 36 valem só para o catálogo.

### 1. Ovo Branco — Tipo Normal

#### Tigrin · `tigrin` · Normal · Comum · ✅ **no jogo**
**Base.** O Tigrinho equilibrado, com grande potencial de adaptação. É o
sprite que já existe: filhote laranja listrado, com colete vermelho e dourado.
*Sprite pronto.*

#### Nv. 16

| Forma | id | Tipo | Raridade | Requisito |
|---|---|---|---|---|
| Tigreluz | `tigreluz` | Normal/Luz | Raro | Felicidade ≥ 80% e Saúde ≥ 80% |
| MenteTigre | `mentetigre` | Normal/Psíquico | Raro | Sabedoria ≥ 85% |
| Sombriger | `sombriger` | Normal/Sombrio | Raro | Saciedade ≥ 90% e Sabedoria ≥ 80% |

- **Tigreluz:** pelagem clara e brilhante, quase branca, com listras
  douradas que emitem luz. Tem um leve halo atrás da cabeça.
- **MenteTigre:** flutua de pernas cruzadas, com olhos violeta e uma joia
  na testa. Pequenos objetos orbitam ao redor, levitando.
- **Sombriger:** tigre noturno e furtivo, de pelagem grafite e listras
  roxo-escuras, com olhos que brilham. Está bem alimentado e é ágil, não
  ameaçador. Postura de caçador agachado.

#### Nv. 36 — linha do Tigreluz

| Forma | id | Raridade | Requisito |
|---|---|---|---|
| Palatigre | `palatigre` | Lendário | Saúde ≥ 100% |
| Auroriger | `auroriger` | Épico | Felicidade ≥ 100% |
| Tigreanjo | `tigreanjo` | Épico | Sabedoria ≥ 90% |

- **Palatigre:** paladino de armadura dourada e branca, com escudo de sol
  no peito, porte nobre e capa luminosa.
- **Auroriger:** pelagem com gradiente de aurora (rosa, laranja, lilás) e
  cauda que deixa um rastro de luz colorida.
- **Tigreanjo:** asas de penas brancas, auréola dourada e expressão serena.

#### Nv. 36 — linha do MenteTigre (vence o status mais alto)

| Forma | id | Raridade | Favorece |
|---|---|---|---|
| Alquimiger | `alquimiger` | Lendário | Sabedoria |
| Tigre-Mestre | `tigre-mestre` | Épico | Saúde ou Saciedade |
| Ilusioniger | `ilusioniger` | Épico | Felicidade |

- **Alquimiger:** alquimista com frascos flutuando, símbolos rúnicos
  girando ao redor e manto com bordados dourados.
- **Tigre-Mestre:** monge musculoso em postura de meditação, com faixa na
  cintura e aura calma.
- **Ilusioniger:** mágico de cartola e capa, com cópias translúcidas de si
  mesmo ao lado.

#### Nv. 36 — linha do Sombriger (vence o status mais alto)

| Forma | id | Raridade | Favorece |
|---|---|---|---|
| Tigre-Abissal | `tigre-abissal` | Lendário | Sabedoria |
| Fantomiger | `fantomiger` | Épico | Felicidade |
| Gatuno-Noturno | `gatuno-noturno` | Épico | Saúde ou Saciedade |

- **Tigre-Abissal:** enorme, com o corpo se desfazendo em névoa escura nas
  bordas e olhos como estrelas distantes. Imponente e majestoso.
- **Fantomiger:** fantasma brincalhão, semitransparente e azulado, com
  cauda que vira fumaça.
- **Gatuno-Noturno:** ladrão ágil com máscara de bandido, cachecol e
  postura de quem está prestes a saltar.

---

### 2. Ovo Vermelho — Tipo Fogo

#### Brasinha · `brasinha` · Fogo · Comum · ✅ **no jogo**
**Base.** Um Tigrinho quente, com pelagem avermelhada e muita energia. Ponta
da cauda e tufos das orelhas em brasa, com faíscas pequenas. Use laranja e
âmbar no corpo para não sumir no fundo vermelho.

#### Nv. 16

| Forma | id | Tipo | Raridade | Requisito |
|---|---|---|---|---|
| ✅ Tigre-Fornalha | `tigre-fornalha` | Fogo/Metálico | Raro | Saúde ≥ 90% e Sabedoria ≥ 70% |
| Chamatigre | `chamatigre` | Fogo/Fada | Raro | Felicidade ≥ 85% |
| Vulcaniger | `vulcaniger` | Fogo/Terrestre | Raro | Saciedade ≥ 95% |

- **Tigre-Fornalha:** armadura de ferro quente com placas rebitadas e
  brilho incandescente nas juntas. Uma chaminé solta fumaça das costas.
- **Chamatigre:** fogo mágico e curativo em tons rosa e dourado, com
  chamas suaves como pétalas e brilhinhos de fada.
- **Vulcaniger:** corpo de rocha escura com rachaduras de magma. O excesso
  de energia vira combustível, e o pet tem ar robusto e satisfeito.

#### Nv. 36 — linha do Tigre-Fornalha

| Forma | id | Raridade | Favorece |
|---|---|---|---|
| ✅ Mechatigre | `mechatigre` | Lendário | Sabedoria |
| Tigre-Tanque | `tigre-tanque` | Épico | Saúde ou Saciedade |
| Tigre-Forja | `tigre-forja` | Épico | Felicidade |

- **Mechatigre:** tigre-robô de metal polido com núcleo de fogo visível no
  peito e olhos de LED âmbar.
- **Tigre-Tanque:** blindagem pesada e larga, quase blocado, com patas como
  esteiras.
- **Tigre-Forja:** ferreiro alegre com avental de couro e martelo, e
  bigodes chamuscados.

#### Nv. 36 — linha do Chamatigre

| Forma | id | Raridade | Favorece |
|---|---|---|---|
| Fenixger | `fenixger` | Lendário | Felicidade |
| Tigre-Solar | `tigre-solar` | Épico | Saúde ou Saciedade |
| Mago-Chama | `mago-chama` | Épico | Sabedoria |

- **Fenixger:** asas de fênix em chamas douradas e cauda longa de penas de
  fogo, em pose de renascimento.
- **Tigre-Solar:** juba como coroa de sol, com raios ao redor e pelagem
  dourada.
- **Mago-Chama:** chapéu e cajado de mago, com uma bola de fogo flutuando
  na pata.

#### Nv. 36 — linha do Vulcaniger

| Forma | id | Raridade | Favorece |
|---|---|---|---|
| Tigre-Terremoto | `tigre-terremoto` | Lendário | Saciedade |
| Magmatígreo | `magmatigreo` | Épico | Saúde |
| Tigre-Meteoro | `tigre-meteoro` | Épico | Sabedoria ou Felicidade |

- **Tigre-Terremoto:** colossal, com pedregulhos flutuando ao redor e o
  chão rachando sob as patas.
- **Magmatígreo:** corpo de magma líquido escorrendo, com crosta escura
  por cima.
- **Tigre-Meteoro:** envolto em rocha incandescente, em pose de mergulho
  e com rastro de fogo.

---

### 3. Ovo Azul — Tipo Água

#### Gotigre · `gotigre` · Água · Comum · ✅ **no jogo**
**Base.** Um Tigrinho dócil, com cauda semelhante a uma gota d'água. Pelagem
azul-clara e listras azul-marinho. O sprite antigo `tigrinho-1.webp` (Tigre
d'Água) pode servir de referência.

#### Nv. 16

| Forma | id | Tipo | Raridade | Requisito |
|---|---|---|---|---|
| Coraliger | `coraliger` | Água/Fada | Raro | Felicidade ≥ 90% |
| ✅ Neviger | `neviger` | Água/Gelo | Raro | Sabedoria ≥ 70% e Saúde ≥ 80% |
| Toxitigre | `toxitigre` | Água/Veneno | Raro | Sabedoria ≥ 95% e Saúde ≥ 90% |

- **Coraliger:** escamas coloridas e corais crescendo nos ombros e na
  cauda, em tons coral, turquesa e rosa.
- **Neviger:** a água do corpo congela e forma uma armadura de gelo
  cristalino, com respiração em vapor frio.
- **Toxitigre:** controla toxinas sem se ferir, com bolhas verde-ácido
  flutuando ao redor da pata. Visual de cientista: olhar concentrado e
  pelagem saudável, sem aparência doente.

#### Nv. 36 — linha do Coraliger

| Forma | id | Raridade | Favorece |
|---|---|---|---|
| ✅ Tigre-Leviatã | `tigre-leviata` | Lendário | Saúde ou Saciedade |
| Sereiger | `sereiger` | Épico | Felicidade |
| Oceaniger | `oceaniger` | Épico | Sabedoria |

- **Tigre-Leviatã:** corpo serpentino e longo, com barbatanas e escamas
  azul-profundo. Parece um dragão marinho.
- **Sereiger:** cauda de sereia no lugar das patas traseiras, com conchas
  e pérolas.
- **Oceaniger:** ondas formam a juba e o pet carrega um tridente. Ar
  sábio.

#### Nv. 36 — linha do Neviger

| Forma | id | Raridade | Favorece |
|---|---|---|---|
| ✅ Tigre-Glacial | `tigre-glacial` | Lendário | Sabedoria |
| Tigre-Nevasca | `tigre-nevasca` | Épico | Saúde ou Saciedade |
| Cristaliger | `cristaliger` | Épico | Felicidade |

- **Tigre-Glacial:** enorme, com coroa de estalactites e geada se
  espalhando a partir das patas.
- **Tigre-Nevasca:** pelagem branca e volumosa, com um redemoinho de neve
  ao redor do corpo.
- **Cristaliger:** corpo com facetas de cristal que refletem arco-íris.

#### Nv. 36 — linha do Toxitigre

| Forma | id | Raridade | Favorece |
|---|---|---|---|
| Tigre-Pantanoso | `tigre-pantanoso` | Lendário | Saúde ou Saciedade |
| Poluiger | `poluiger` | Épico | Felicidade |
| Tigre-Ácido | `tigre-acido` | Épico | Sabedoria |

- **Tigre-Pantanoso:** grande e calmo, com musgo e plantas de pântano no
  dorso, e vagalumes ao redor.
- **Poluiger:** criatura de gosma roxa e verde, simpática e de sorriso
  largo.
- **Tigre-Ácido:** listras verde-neon e frascos no cinto, com gotas
  ácidas brilhantes. Visual de alquimista.

---

### 4. Ovo Verde — Tipo Grama

#### Folhiger · `folhiger` · Grama · Comum · ✅ **no jogo**
**Base.** Um Tigrinho com folhagens no lugar da juba, que adora sol. Pelagem
verde-oliva clara, com um broto na ponta da cauda.

#### Nv. 16

| Forma | id | Tipo | Raridade | Requisito |
|---|---|---|---|---|
| ✅ Floriger | `floriger` | Grama/Fada | Raro | Felicidade ≥ 90% |
| Troncotigre | `troncotigre` | Grama/Lutador | Raro | Saúde ≥ 90% e Saciedade ≥ 80% |
| Espinhiger | `espinhiger` | Grama/Sombrio | Raro | Saúde ≥ 95% e Sabedoria ≥ 85% |

- **Floriger:** flores exóticas desabrocham na juba, com pétalas soltas no
  ar.
- **Troncotigre:** robusto, com patas que parecem madeira de carvalho,
  casca de árvore nos ombros e postura de lutador.
- **Espinhiger:** folhas supernutridas viram espinhos robustos de defesa,
  em verde-escuro com pontas arroxeadas. Saudável e alerta, sem aparência
  murcha.

#### Nv. 36 — linha do Floriger

| Forma | id | Raridade | Favorece |
|---|---|---|---|
| ✅ Tigre-Yggdrasil | `tigre-yggdrasil` | Lendário | Saúde ou Saciedade |
| Xamãtiger | `xamatiger` | Épico | Sabedoria |
| Primaveriger | `primaveriger` | Épico | Felicidade |

- **Tigre-Yggdrasil:** uma árvore inteira cresce nas costas, com raízes
  nas patas e copa luminosa.
- **Xamãtiger:** máscara de madeira, colares de sementes e um cajado com
  folhas.
- **Primaveriger:** coberto de flores de cerejeira, com borboletas ao
  redor.

#### Nv. 36 — linha do Troncotigre

| Forma | id | Raridade | Favorece |
|---|---|---|---|
| Tigre-Titã | `tigre-tita` | Lendário | Saúde ou Saciedade |
| Lenhadoriger | `lenhadoriger` | Épico | Sabedoria |
| Tigre-Selvagem | `tigre-selvagem` | Épico | Felicidade |

- **Tigre-Titã:** gigante de madeira e pedra coberto de musgo, com
  cristais verdes no peito.
- **Lenhadoriger:** camisa xadrez, machado nas costas e barba de folhas.
- **Tigre-Selvagem:** com cipós e pinturas tribais verdes, em pose de
  rugido alegre.

#### Nv. 36 — linha do Espinhiger

| Forma | id | Raridade | Favorece |
|---|---|---|---|
| Tigre-Parasita | `tigre-parasita` | Lendário | Sabedoria |
| Tigre-Venoso | `tigre-venoso` | Épico | Saúde ou Saciedade |
| Sombra-Da-Mata | `sombra-da-mata` | Épico | Felicidade |

- **Tigre-Parasita:** trepadeiras e cogumelos bioluminescentes crescem pelo
  corpo, com uma flor carnívora na cauda. Misterioso, não grotesco.
- **Tigre-Venoso:** espinhos roxos com gotas de veneno nas pontas e
  pelagem verde-escura.
- **Sombra-Da-Mata:** quase invisível entre as folhas, com camuflagem de
  folhagem e olhos brilhando no escuro.

---

## Checklist

| Forma | No jogo | Sprite pronto |
|---|---|---|
| `tigrin` | ✅ | ✅ |
| `estreliger` | ✅ |  |
| `tigre-cosmico` | ✅ | ✅ |
| `tigreluz` |  |  |
| `mentetigre` |  |  |
| `sombriger` |  |  |
| `palatigre` |  |  |
| `auroriger` |  |  |
| `tigreanjo` |  |  |
| `alquimiger` |  |  |
| `tigre-mestre` |  |  |
| `ilusioniger` |  |  |
| `tigre-abissal` |  |  |
| `fantomiger` |  |  |
| `gatuno-noturno` |  |  |
| `brasinha` | ✅ |  |
| `tigre-fornalha` | ✅ |  |
| `chamatigre` |  |  |
| `vulcaniger` |  |  |
| `mechatigre` | ✅ |  |
| `tigre-tanque` |  |  |
| `tigre-forja` |  |  |
| `fenixger` |  |  |
| `tigre-solar` |  |  |
| `mago-chama` |  |  |
| `tigre-terremoto` |  |  |
| `magmatigreo` |  |  |
| `tigre-meteoro` |  |  |
| `gotigre` | ✅ |  |
| `tigre-dagua` | ✅ | ✅ |
| `coraliger` |  |  |
| `neviger` | ✅ |  |
| `toxitigre` |  |  |
| `tigre-leviata` | ✅ |  |
| `sereiger` |  |  |
| `oceaniger` |  |  |
| `tigre-glacial` | ✅ |  |
| `tigre-nevasca` |  |  |
| `cristaliger` |  |  |
| `tigre-pantanoso` |  |  |
| `poluiger` |  |  |
| `tigre-acido` |  |  |
| `folhiger` | ✅ |  |
| `floriger` | ✅ |  |
| `troncotigre` |  |  |
| `espinhiger` |  |  |
| `tigre-yggdrasil` | ✅ |  |
| `xamatiger` |  |  |
| `primaveriger` |  |  |
| `tigre-tita` |  |  |
| `lenhadoriger` |  |  |
| `tigre-selvagem` |  |  |
| `tigre-parasita` |  |  |
| `tigre-venoso` |  |  |
| `sombra-da-mata` |  |  |

`python3 tools/sprites.py` imprime o que ainda falta entre as formas do jogo.
