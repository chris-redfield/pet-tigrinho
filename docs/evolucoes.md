# Evoluções do Pet Tigrinho — guia para os assets

52 formas: 4 bases, 12 no Nv. 16 e 36 no Nv. 36. Cada forma traz o nome, o
tipo, a raridade, o que leva o pet até ela e uma descrição curta pensada para
o desenho.

Fonte da verdade dos dados: [`src/js/forms.js`](../src/js/forms.js). Se mudar
algum requisito lá, atualize aqui também.

## Como entregar cada sprite

- **Arquivo original:** `assets/source/<id>.png`, sem mexer depois.
- **Sprite do jogo:** `assets/pet/<id>.webp`, 900px de largura, recortado
  pelo alfa. O comando está na seção *Art pipeline* do README.
- **Fundo transparente** (PNG com alfa). Sem chão, sem cenário, sem moldura.
- **Pose de corpo inteiro, de frente ou em 3/4**, com a mesma leitura de
  "mascote" do Tigrin atual (`assets/source/starting-tiger.png`).
- **Efeitos ao redor** (chamas, água, estrelas) podem sair da silhueta. Para
  isso a forma ganha um `scale` maior em `forms.js`.
- **Paleta:** cada linha tem sua cor dominante, mas todas convivem com o
  fundo vermelho-laca e dourado do jogo. Evite vermelho puro no corpo de
  formas que não sejam de Fogo, porque some no fundo.
- **Ligar o sprite:** em `forms.js`, troque `art` daquela forma para
  `assets/pet/<id>.webp`.

**Raridades:** Comum (base) · Raro (Nv. 16) · Épico / Lendário (Nv. 36).
Uma boa regra visual: quanto mais rara a forma, mais elaborados o porte,
os ornamentos e os efeitos. O Lendário de cada linha deve ser o mais
imponente dos três.

**Status:** Sabedoria (Leitura + Estudo) · Felicidade (Foto) ·
Saciedade (Refeição) · Saúde (Passos).

**Regra de escolha:**
- **Nv. 16:** vale a rota mais exigente cujos requisitos foram cumpridos. Se
  nenhuma foi cumprida, vale a que chegou mais perto.
- **Nv. 36 (exceto a linha do Tigreluz):** vale a forma cujo status
  favorecido é o mais alto.

---

## 1. Ovo Branco — Tipo Normal

### Tigrin · `tigrin` · Normal · Comum
**Base.** O Tigrinho equilibrado, com grande potencial de adaptação. É o
sprite que já existe: filhote laranja listrado, com colete vermelho e dourado.
*Sprite pronto.*

### Nv. 16

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

### Nv. 36 — linha do Tigreluz

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

### Nv. 36 — linha do MenteTigre (vence o status mais alto)

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

### Nv. 36 — linha do Sombriger (vence o status mais alto)

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

## 2. Ovo Vermelho — Tipo Fogo

### Brasinha · `brasinha` · Fogo · Comum
**Base.** Um Tigrinho quente, com pelagem avermelhada e muita energia. Ponta
da cauda e tufos das orelhas em brasa, com faíscas pequenas. Use laranja e
âmbar no corpo para não sumir no fundo vermelho.

### Nv. 16

| Forma | id | Tipo | Raridade | Requisito |
|---|---|---|---|---|
| Tigre-Fornalha | `tigre-fornalha` | Fogo/Metálico | Raro | Saúde ≥ 90% e Sabedoria ≥ 70% |
| Chamatigre | `chamatigre` | Fogo/Fada | Raro | Felicidade ≥ 85% |
| Vulcaniger | `vulcaniger` | Fogo/Terrestre | Raro | Saciedade ≥ 95% |

- **Tigre-Fornalha:** armadura de ferro quente com placas rebitadas e
  brilho incandescente nas juntas. Uma chaminé solta fumaça das costas.
- **Chamatigre:** fogo mágico e curativo em tons rosa e dourado, com
  chamas suaves como pétalas e brilhinhos de fada.
- **Vulcaniger:** corpo de rocha escura com rachaduras de magma. O excesso
  de energia vira combustível, e o pet tem ar robusto e satisfeito.

### Nv. 36 — linha do Tigre-Fornalha

| Forma | id | Raridade | Favorece |
|---|---|---|---|
| Mechatigre | `mechatigre` | Lendário | Sabedoria |
| Tigre-Tanque | `tigre-tanque` | Épico | Saúde ou Saciedade |
| Tigre-Forja | `tigre-forja` | Épico | Felicidade |

- **Mechatigre:** tigre-robô de metal polido com núcleo de fogo visível no
  peito e olhos de LED âmbar.
- **Tigre-Tanque:** blindagem pesada e larga, quase blocado, com patas como
  esteiras.
- **Tigre-Forja:** ferreiro alegre com avental de couro e martelo, e
  bigodes chamuscados.

### Nv. 36 — linha do Chamatigre

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

### Nv. 36 — linha do Vulcaniger

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

## 3. Ovo Azul — Tipo Água

### Gotigre · `gotigre` · Água · Comum
**Base.** Um Tigrinho dócil, com cauda semelhante a uma gota d'água. Pelagem
azul-clara e listras azul-marinho. O sprite antigo `tigrinho-1.webp` (Tigre
d'Água) pode servir de referência.

### Nv. 16

| Forma | id | Tipo | Raridade | Requisito |
|---|---|---|---|---|
| Coraliger | `coraliger` | Água/Fada | Raro | Felicidade ≥ 90% |
| Neviger | `neviger` | Água/Gelo | Raro | Sabedoria ≥ 70% e Saúde ≥ 80% |
| Toxitigre | `toxitigre` | Água/Veneno | Raro | Sabedoria ≥ 95% e Saúde ≥ 90% |

- **Coraliger:** escamas coloridas e corais crescendo nos ombros e na
  cauda, em tons coral, turquesa e rosa.
- **Neviger:** a água do corpo congela e forma uma armadura de gelo
  cristalino, com respiração em vapor frio.
- **Toxitigre:** controla toxinas sem se ferir, com bolhas verde-ácido
  flutuando ao redor da pata. Visual de cientista: olhar concentrado e
  pelagem saudável, sem aparência doente.

### Nv. 36 — linha do Coraliger

| Forma | id | Raridade | Favorece |
|---|---|---|---|
| Tigre-Leviatã | `tigre-leviata` | Lendário | Saúde ou Saciedade |
| Sereiger | `sereiger` | Épico | Felicidade |
| Oceaniger | `oceaniger` | Épico | Sabedoria |

- **Tigre-Leviatã:** corpo serpentino e longo, com barbatanas e escamas
  azul-profundo. Parece um dragão marinho.
- **Sereiger:** cauda de sereia no lugar das patas traseiras, com conchas
  e pérolas.
- **Oceaniger:** ondas formam a juba e o pet carrega um tridente. Ar
  sábio.

### Nv. 36 — linha do Neviger

| Forma | id | Raridade | Favorece |
|---|---|---|---|
| Tigre-Glacial | `tigre-glacial` | Lendário | Sabedoria |
| Tigre-Nevasca | `tigre-nevasca` | Épico | Saúde ou Saciedade |
| Cristaliger | `cristaliger` | Épico | Felicidade |

- **Tigre-Glacial:** enorme, com coroa de estalactites e geada se
  espalhando a partir das patas.
- **Tigre-Nevasca:** pelagem branca e volumosa, com um redemoinho de neve
  ao redor do corpo.
- **Cristaliger:** corpo com facetas de cristal que refletem arco-íris.

### Nv. 36 — linha do Toxitigre

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

## 4. Ovo Verde — Tipo Grama

### Folhiger · `folhiger` · Grama · Comum
**Base.** Um Tigrinho com folhagens no lugar da juba, que adora sol. Pelagem
verde-oliva clara, com um broto na ponta da cauda.

### Nv. 16

| Forma | id | Tipo | Raridade | Requisito |
|---|---|---|---|---|
| Floriger | `floriger` | Grama/Fada | Raro | Felicidade ≥ 90% |
| Troncotigre | `troncotigre` | Grama/Lutador | Raro | Saúde ≥ 90% e Saciedade ≥ 80% |
| Espinhiger | `espinhiger` | Grama/Sombrio | Raro | Saúde ≥ 95% e Sabedoria ≥ 85% |

- **Floriger:** flores exóticas desabrocham na juba, com pétalas soltas no
  ar.
- **Troncotigre:** robusto, com patas que parecem madeira de carvalho,
  casca de árvore nos ombros e postura de lutador.
- **Espinhiger:** folhas supernutridas viram espinhos robustos de defesa,
  em verde-escuro com pontas arroxeadas. Saudável e alerta, sem aparência
  murcha.

### Nv. 36 — linha do Floriger

| Forma | id | Raridade | Favorece |
|---|---|---|---|
| Tigre-Yggdrasil | `tigre-yggdrasil` | Lendário | Saúde ou Saciedade |
| Xamãtiger | `xamatiger` | Épico | Sabedoria |
| Primaveriger | `primaveriger` | Épico | Felicidade |

- **Tigre-Yggdrasil:** uma árvore inteira cresce nas costas, com raízes
  nas patas e copa luminosa.
- **Xamãtiger:** máscara de madeira, colares de sementes e um cajado com
  folhas.
- **Primaveriger:** coberto de flores de cerejeira, com borboletas ao
  redor.

### Nv. 36 — linha do Troncotigre

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

### Nv. 36 — linha do Espinhiger

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

## Checklist de sprites

`[x]` pronto · `[ ]` falta

- [x] tigrin
- [ ] brasinha · gotigre · folhiger
- [ ] tigreluz · mentetigre · sombriger
- [ ] tigre-fornalha · chamatigre · vulcaniger
- [ ] coraliger · neviger · toxitigre
- [ ] floriger · troncotigre · espinhiger
- [ ] palatigre · auroriger · tigreanjo
- [ ] alquimiger · tigre-mestre · ilusioniger
- [ ] tigre-abissal · fantomiger · gatuno-noturno
- [ ] mechatigre · tigre-tanque · tigre-forja
- [ ] fenixger · tigre-solar · mago-chama
- [ ] tigre-terremoto · magmatigreo · tigre-meteoro
- [ ] tigre-leviata · sereiger · oceaniger
- [ ] tigre-glacial · tigre-nevasca · cristaliger
- [ ] tigre-pantanoso · poluiger · tigre-acido
- [ ] tigre-yggdrasil · xamatiger · primaveriger
- [ ] tigre-tita · lenhadoriger · tigre-selvagem
- [ ] tigre-parasita · tigre-venoso · sombra-da-mata
