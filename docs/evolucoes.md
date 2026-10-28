# Evoluções do Pet Tigrinho — guia e prompts dos sprites

Este guia tem duas partes. **No jogo** são as formas implementadas hoje, com o
prompt que gerou cada sprite. O **catálogo completo** no fim guarda as 52 formas do
design original; as marcadas com ✅ são as que estão no jogo, e as outras
ficam como ideia para depois.

## No jogo

14 formas em 5 linhas de 3 estágios, saindo de 4 ovos. O Ovo Azul é o único
que ramifica: no Nv. 16 o Tigre d'Água vira Oceaniger ou Neviger, conforme os
status.

Todas as 14 têm sprite (`assets/pet/<id>.webp`).

| Ovo | Base (Comum) | Nv. 16 (Raro) | Nv. 36 (Lendário) |
|---|---|---|---|
| Branco | Tigrin | Estreliger | Tigre Cósmico |
| Vermelho | Brasinha | Tigre-Fornalha | Mechatigre |
| Azul | Tigre d'Água | Oceaniger | Tigre-Leviatã |
| Azul | ″ | Neviger | Tigre-Glacial |
| Verde | Folhiger | Floriger | Tigre-Yggdrasil |

Fonte da verdade dos dados: [`src/js/forms.js`](../src/js/forms.js). Se mudar
algum requisito lá, atualize aqui também.

### Regra do Ovo Azul (Nv. 16)

No Nv. 16 o Tigre d'Água vira Água ou Gelo conforme os status naquele momento:

| Rota | Requisito |
|---|---|
| Oceaniger (Água) | Felicidade ≥ 70% |
| Neviger (Gelo) | Sabedoria ≥ 60% **e** Saúde ≥ 60% |

Cada rota tem uma **folga**: quanto o status *mais fraco* que ela pede passou
do requisito (ou quanto faltou, se for negativo). **Vence a maior folga.**

- **Só uma rota cumprida:** ela vence.
- **As duas cumpridas:** vence a que passou por mais. Ex.: Felicidade 95%,
  Sabedoria 65%, Saúde 70% → Água tem folga +25, Gelo +5 → **Oceaniger**.
  Felicidade 72%, Sabedoria 85%, Saúde 90% → Água +2, Gelo +25 → **Neviger**.
- **Nenhuma cumprida:** vence a que chegou mais perto.
- **Empate:** vence Oceaniger (a primeira listada em `forms.js`).

Nada é sorteado: os mesmos status sempre dão a mesma forma, e a tela de
informações (ⓘ) mostra ao vivo para qual forma o pet evoluiria agora. As
outras linhas evoluem direto, sem escolha.

---

## Como os sprites foram feitos

Sem API: as imagens saíram da interface web do ChatGPT, e o resto é
automático. Os prompts abaixo são os que funcionaram — use-os de modelo para
formas novas.

### Receita

- **Uma mensagem por forma**, com a ferramenta **Criar imagem**, na conversa
  original do Tigrin ou numa conversa nova (os prompts não dependem do
  histórico).
- **Anexe sempre `assets/source/tigrin.png`** como referência de estilo. Numa
  evolução, anexe também a forma anterior (a segunda imagem).
- **Todo prompt pede as mesmas três coisas:** manter o estilo Pokémon,
  manter sintético (pouco detalhe) e fundo transparente — e só então lista o
  que muda na forma.
- **Evolução = um pouco maior, mais velha e mais confiante, mas ainda
  fofa.** O Lendário é o mais imponente da linha e nunca assustador.
- Se o resultado não ficar bom, peça uma alteração pontual sobre a imagem em
  vez de repetir o prompt.

### Pro jogo

1. Salve o PNG como `assets/source/<id>.png` — exatamente o id da forma
   (`mechatigre`, não `mecha-tigre`; `tigre-leviata`, sem acento).
2. Rode:

   ```sh
   python3 tools/sprites.py
   ```

   Ele recorta, redimensiona para 900px, grava `assets/pet/<id>.webp`, liga o
   sprite no jogo (`src/js/sprites.js`) e lista o que ainda falta.

**Se o fundo não vier transparente** (o script avisa): peça de novo ou rode
`python3 tools/sprites.py --knockout`. O knockout só apaga o fundo ligado às
bordas; um buraco branco fechado (entre a cauda e o corpo, por exemplo)
continua branco.

**Se o pet ficar pequeno ou grande demais na tela:** passe `scale` na forma
em `forms.js` (largura do sprite em % da tela; padrão 62 / 78 / 84 por
raridade).

### Os três blocos que se repetem

Forma base (anexo: `tigrin.png`):

```text
Create a <element> version of the tiger in the attached image, as if it
were a new Pokémon of the same evolution family.

Keep everything else the same: same age and size, same pose, same art
style. Keep the Pokémon style: a cute creature design with simple
readable shapes, clean outlines and bright cel shading, like official
Pokémon art. Keep it synthetic: low detail, flat shading, clean bold
shapes. Transparent background, and nothing else on the screen: no
letters, no playing cards, no coins.

What changes in this <element> version:
- ...
```

Evolução (anexos: `tigrin.png` + a forma anterior):

```text
The first attached image is the style reference. The second attached
image is <forma anterior>, <uma frase sobre ela>. Create the evolution of
<forma anterior>, as if it were the second stage of a Pokémon evolution
line.

Keep the Pokémon style: a cute creature design with simple readable
shapes, clean outlines and bright cel shading, like official Pokémon art.
Keep it synthetic: low detail, flat shading, clean bold shapes.
Transparent background, and nothing else on the screen: no letters, no
playing cards, no coins.

It is an evolution, so it is a bit bigger, older and more confident than
<forma anterior>, but still cute. Keep its <cores>, and the same art
style.

What is new in this evolution:
- ...
```

Lendário: igual à evolução, trocando o pedido por *"Create its final
evolution, the legendary last stage of this Pokémon evolution line"* e o
parágrafo do porte por *"It is the final evolution, so it is bigger and
more impressive than <forma anterior>, but still cute and friendly, never
scary."*

---

## 1. Ovo Branco — linha Cósmica

### Tigrin · `tigrin` · Normal · Comum 🎨
Filhote laranja listrado, com colete vermelho e dourado. É a referência de
estilo de todos os outros.

### Estreliger · `estreliger` · Normal/Cósmico · Raro 🎨
Anexos: `tigrin.png` + `tigre-cosmico.png` (a forma do meio precisa ver as
duas pontas).

```text
The first attached image is Tigrin, the first stage of a Pokémon
evolution line. The second attached image is Tigre Cósmico, its final
stage. Create the middle stage between them: the evolution of Tigrin
that later becomes Tigre Cósmico.

Keep the Pokémon style: a cute creature design with simple readable
shapes, clean outlines and bright cel shading, like official Pokémon art.
Keep it synthetic: low detail, flat shading, clean bold shapes.
Transparent background, and nothing else on the screen: no letters, no
playing cards, no coins.

It is halfway between the two: a bit bigger and more confident than
Tigrin, but clearly less cosmic than Tigre Cósmico. Same art style, same
cute face and big ears.

What is new in this evolution:
- the orange fur starts turning deep navy blue at the paws, ears and
  tail tip, like the night sky arriving
- the dark stripes start to glow softly gold, like constellations
- a small gold four-pointed star mark on the forehead
- eyes with a small star sparkle
- three or four small gold stars orbiting around the body
- keeps a simpler version of Tigrin's red and gold vest
- no planets and no galaxy tail yet: those come with the final form
```

### Tigre Cósmico · `tigre-cosmico` · Normal/Cósmico · Lendário 🎨
Galáxia na cauda, planetas em órbita. Feito antes deste guia, a partir de
uma versão verde-azulada do Tigrin (*"make it a cosmic version of it"*).

---

## 2. Ovo Vermelho — linha Fogo/Metálico

### Brasinha · `brasinha` · Fogo · Comum 🎨
Anexo: `tigrin.png`

```text
Create a fire version of the tiger in the attached image, as if it were a
new Pokémon of the same evolution family.

Keep everything else the same: same age and size, same pose, same art
style. Keep the Pokémon style: a cute creature design with simple
readable shapes, clean outlines and bright cel shading, like official
Pokémon art. Keep it synthetic: low detail, flat shading, clean bold
shapes. Transparent background, and nothing else on the screen: no
letters, no playing cards, no coins.

What changes in this fire version:
- warm orange-amber fur with dark brown stripes
- the tip of the tail and the ear tufts glow like burning embers
- a few tiny sparks floating around the body
- no vest
- use orange and amber, not pure red, so it does not disappear on a red
  background
```

### Tigre-Fornalha · `tigre-fornalha` · Fogo/Metálico · Raro 🎨
Anexos: `tigrin.png` + `brasinha.png`

```text
The first attached image is the style reference. The second attached
image is Brasinha, a fire tiger. Create the evolution of Brasinha, as if
it were the next stage of a Pokémon evolution line.

Keep the Pokémon style: a cute creature design with simple readable
shapes, clean outlines and bright cel shading, like official Pokémon art.
Keep it synthetic: low detail, flat shading, clean bold shapes.
Transparent background, and nothing else on the screen: no letters, no
playing cards, no coins.

It is an evolution, so it is a bit bigger, older and more confident than
Brasinha, but still cute. Keep its orange-amber fur, dark brown stripes
and ember glow, and the same art style.

What is new in this evolution:
- armor of hot iron: a few simple dark-grey plates with rivets on the
  shoulders, chest and front legs
- the gaps between the plates glow orange, like heat from inside
- a small chimney on its back puffing a little light smoke
- the tail tip burns with a bigger flame than Brasinha's
- proud, cheerful expression
```

### Mechatigre · `mechatigre` · Fogo/Metálico · Lendário 🎨
Anexos: `tigrin.png` + `tigre-fornalha.png`

```text
The first attached image is the style reference. The second attached
image is Tigre-Fornalha, a fire tiger wearing hot iron armor. Create its
final evolution, the legendary last stage of this Pokémon evolution line.

Keep the Pokémon style: a cute creature design with simple readable
shapes, clean outlines and bright cel shading, like official Pokémon art.
Keep it synthetic: low detail, flat shading, clean bold shapes. It must
be less busy than Tigre-Fornalha: fewer flames, bigger and simpler
shapes. Transparent background, and nothing else on the screen: no
letters, no playing cards, no coins.

It is the final evolution, so it is bigger and more impressive than
Tigre-Fornalha, but still cute and friendly, never scary. The iron armor
has taken over completely: it is now a robot tiger.

What is new in this evolution:
- the whole body is made of polished steel and dark gunmetal plates with
  gold trim, still shaped like the same cute tiger with big ears
- a round glowing fire core visible in the middle of the chest
- big glowing amber eyes, like LED lights, still cute and expressive
- a segmented mechanical tail with a flame at the tip
- small jet flames coming out of the paws, as if it is hovering
- a few orange stripes painted on the metal, so it still reads as a tiger
```

---

## 3. Ovo Azul — linhas Água e Gelo

### Tigre d'Água · `tigre-dagua` · Água · Comum 🎨
O inicial de água: pelagem verde-azulada, ondas na cauda e gotas
flutuando. Feito antes deste guia, a partir do Tigrin (*"make the fur of
this latest image green"* → *"slightly pulled towards blue"*).

### Oceaniger · `oceaniger` · Água · Raro 🎨
Anexos: `tigrin.png` + `tigre-dagua.png`

```text
The first attached image is the style reference. The second attached
image is Tigre d'Água, a water tiger. Create the evolution of Tigre
d'Água, as if it were the second stage of a Pokémon evolution line.

Keep the Pokémon style: a cute creature design with simple readable
shapes, clean outlines and bright cel shading, like official Pokémon art.
Keep it synthetic: low detail, flat shading, clean bold shapes.
Transparent background, and nothing else on the screen: no letters, no
playing cards, no coins.

It is an evolution, so it is a bit bigger, older and more confident than
Tigre d'Água, but still cute. Keep its teal fur, dark stripes and blue
paw pads, and the same art style.

What is new in this evolution:
- the fur is a deeper ocean teal-blue
- a mane made of curling ocean waves around the head and neck
- it holds a small golden trident in one paw
- a fin-like crest along the back and a fin at the tail tip
- fewer, bigger water splashes than Tigre d'Água, simpler shapes
- confident, playful expression
```

### Tigre-Leviatã · `tigre-leviata` · Água · Lendário 🎨
Anexos: `tigrin.png` + `oceaniger.png`

```text
The first attached image is the style reference. The second attached
image is Oceaniger, a water tiger with a wave mane and a trident. Create
its final evolution, the legendary last stage of this Pokémon evolution
line.

Keep the Pokémon style: a cute creature design with simple readable
shapes, clean outlines and bright cel shading, like official Pokémon art.
Keep it synthetic: low detail, flat shading, clean bold shapes.
Transparent background, and nothing else on the screen: no letters, no
playing cards, no coins.

It is the final evolution, so it is bigger and more majestic than
Oceaniger, but still cute and friendly, never scary. It becomes a sea
dragon tiger.

What is new in this evolution:
- a longer, slightly serpentine body, like a sea dragon, with the same
  cute tiger head and big ears
- deep ocean-blue fur with teal stripes
- large fins on the elbows and a fin crest running along the back
- a few pearly scales on the chest
- a long tail that ends in a big, flowing fin
- the wave mane is now bigger and more regal, like a crown of water
- no trident: its power is now its own body
- a few big swirling waves around it, simple shapes, not busy
```

### Neviger · `neviger` · Água/Gelo · Raro 🎨
Anexos: `tigrin.png` + `tigre-dagua.png`

```text
The first attached image is the style reference. The second attached
image is Tigre d'Água, a water tiger. Create an ice evolution of Tigre
d'Água, as if it were the second stage of a Pokémon evolution line where
the water has frozen.

Keep the Pokémon style: a cute creature design with simple readable
shapes, clean outlines and bright cel shading, like official Pokémon art.
Keep it synthetic: low detail, flat shading, clean bold shapes.
Transparent background, and nothing else on the screen: no letters, no
playing cards, no coins.

It is an evolution, so it is a bit bigger, older and more confident than
Tigre d'Água, but still cute. Same art style, same body shape and big
ears.

What is new in this evolution:
- white fur with pale icy-blue stripes
- the water around its body has frozen into armor of clear, faceted ice
  crystals on the shoulders, back and tail
- the tail tip is a big ice crystal
- light-blue paw pads
- a little puff of frosty breath coming out of its mouth
- a few snowflakes floating around instead of water splashes
- calm, confident expression
```

### Tigre-Glacial · `tigre-glacial` · Água/Gelo · Lendário 🎨
Anexos: `tigrin.png` + `neviger.png`

```text
The first attached image is the style reference. The second attached
image is Neviger, an ice tiger with crystal armor. Create its final
evolution, the legendary last stage of this Pokémon evolution line.

Keep the Pokémon style: a cute creature design with simple readable
shapes, clean outlines and bright cel shading, like official Pokémon art.
Keep it synthetic: low detail, flat shading, clean bold shapes.
Transparent background, and nothing else on the screen: no letters, no
playing cards, no coins.

It is the final evolution, so it is bigger, more regal and more
impressive than Neviger, but still cute and friendly, never scary. Same
art style, same cute face and big ears.

What is new in this evolution:
- a crown of icicles on its head
- thick, fluffy white and silver fur with pale icy-blue stripes, like a
  majestic snow tiger
- the ice crystal armor is bigger and covers the chest and legs, with a
  few large clear crystals instead of many small ones
- a long fluffy tail ending in a big ice crystal
- frost spreading from its paws as it moves
- a few snowflakes and ice shards swirling around, simple shapes, not
  busy
- calm, wise, proud expression
```

---

## 4. Ovo Verde — linha Grama

### Folhiger · `folhiger` · Grama · Comum 🎨
Anexo: `tigrin.png`

```text
Create a grass version of the tiger in the attached image, as if it were
a new Pokémon of the same evolution family.

Keep everything else the same: same age and size, same pose, same art
style. Keep the Pokémon style: a cute creature design with simple
readable shapes, clean outlines and bright cel shading, like official
Pokémon art. Keep it synthetic: low detail, flat shading, clean bold
shapes. Transparent background, and nothing else on the screen: no
letters, no playing cards, no coins.

What changes in this grass version:
- light leaf-green fur with dark green stripes
- a small mane of leaves around the head and neck
- a little sprout with two leaves growing from the tail tip
- light green paw pads
- no vest
- sunny, happy expression
```

### Floriger · `floriger` · Grama/Fada · Raro 🎨
Anexos: `tigrin.png` + `folhiger.png`

```text
The first attached image is the style reference. The second attached
image is Folhiger, a grass tiger. Create the evolution of Folhiger, as if
it were the second stage of a Pokémon evolution line.

Keep the Pokémon style: a cute creature design with simple readable
shapes, clean outlines and bright cel shading, like official Pokémon art.
Keep it synthetic: low detail, flat shading, clean bold shapes.
Transparent background, and nothing else on the screen: no letters, no
playing cards, no coins.

It is an evolution, so it is a bit bigger, older and more graceful than
Folhiger, but still cute. Keep its leaf-green fur, dark green stripes and
light green paw pads, and the same art style.

What is new in this evolution:
- the leaf mane is fuller, and a few big flowers in pink, yellow and
  white bloom in it
- the sprout on the tail tip has grown into one open flower
- a few loose petals floating in the air around it
- slightly longer, more elegant legs and tail
- joyful, gentle expression
```

### Tigre-Yggdrasil · `tigre-yggdrasil` · Grama/Fada · Lendário 🎨
Anexos: `tigrin.png` + `floriger.png`

```text
The first attached image is the style reference. The second attached
image is Floriger, a grass tiger with flowers in its leafy mane. Create
its final evolution, the legendary last stage of this Pokémon evolution
line.

Keep the Pokémon style: a cute creature design with simple readable
shapes, clean outlines and bright cel shading, like official Pokémon art.
Keep it synthetic: low detail, flat shading, clean bold shapes.
Transparent background, and nothing else on the screen: no letters, no
playing cards, no coins.

It is the final evolution, so it is bigger, wiser and more impressive
than Floriger, but still cute and friendly, never scary. Same art style,
same cute face and big ears, same leaf-green fur and dark green stripes.

What is new in this evolution:
- a small tree grows from its back, with a round, glowing green canopy
- a few tiny glowing lights in the canopy, like fireflies
- roots gently wrapping around its paws
- a little moss and a few flowers on its shoulders, simpler than
  Floriger's mane
- the tail ends in a bigger leafy branch with one flower
- calm, ancient, kind expression
```

---

## Catálogo completo (design original, 52 formas)

✅ = está no jogo. As demais **não estão ligadas no código** e ficam aqui como
referência para versões futuras. Para trazer uma de volta, adicione-a em
`src/js/forms.js` e marque-a aqui.

Diferenças entre o catálogo e o jogo atual:

- A linha cósmica (Tigrin → **Estreliger** → **Tigre Cósmico**) e o **Tigre
  d'Água** são novos e não aparecem no catálogo.
- No jogo, o Ovo Azul choca o **Tigre d'Água** no lugar do Gotigre.
- No jogo, o **Oceaniger** é a forma Raro (Nv. 16) da linha de água, e o
  Tigre-Leviatã vem dele (no catálogo, o Oceaniger é um Épico do Nv. 36 e o
  Leviatã vem do Coraliger).
- No jogo, o Neviger vem do Tigre d'Água e pede Sabedoria ≥ 60% e Saúde ≥
  60% (no catálogo, 70% e 80% a partir do Gotigre).
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

#### Gotigre · `gotigre` · Água · Comum
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
| ✅ Oceaniger | `oceaniger` | Épico | Sabedoria |

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
| `estreliger` | ✅ | ✅ |
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
| `brasinha` | ✅ | ✅ |
| `tigre-fornalha` | ✅ | ✅ |
| `chamatigre` |  |  |
| `vulcaniger` |  |  |
| `mechatigre` | ✅ | ✅ |
| `tigre-tanque` |  |  |
| `tigre-forja` |  |  |
| `fenixger` |  |  |
| `tigre-solar` |  |  |
| `mago-chama` |  |  |
| `tigre-terremoto` |  |  |
| `magmatigreo` |  |  |
| `tigre-meteoro` |  |  |
| `gotigre` |  |  |
| `tigre-dagua` | ✅ | ✅ |
| `coraliger` |  |  |
| `neviger` | ✅ | ✅ |
| `toxitigre` |  |  |
| `tigre-leviata` | ✅ | ✅ |
| `sereiger` |  |  |
| `oceaniger` | ✅ | ✅ |
| `tigre-glacial` | ✅ | ✅ |
| `tigre-nevasca` |  |  |
| `cristaliger` |  |  |
| `tigre-pantanoso` |  |  |
| `poluiger` |  |  |
| `tigre-acido` |  |  |
| `folhiger` | ✅ | ✅ |
| `floriger` | ✅ | ✅ |
| `troncotigre` |  |  |
| `espinhiger` |  |  |
| `tigre-yggdrasil` | ✅ | ✅ |
| `xamatiger` |  |  |
| `primaveriger` |  |  |
| `tigre-tita` |  |  |
| `lenhadoriger` |  |  |
| `tigre-selvagem` |  |  |
| `tigre-parasita` |  |  |
| `tigre-venoso` |  |  |
| `sombra-da-mata` |  |  |

Todas as formas do jogo têm sprite. `python3 tools/sprites.py` confere.
