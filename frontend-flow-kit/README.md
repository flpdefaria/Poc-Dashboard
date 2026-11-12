# Kit do fluxo de desenvolvimento front-end

Leva para qualquer projeto Vue + PrimeVue o fluxo de desenvolvimento front-end: agentes, skills, instruções, MCPs, checagem de
convenções e o harness visual de QA. O stack é **Vue 3 + PrimeVue 4 + Tailwind v4 + Lucide**, com
**Figma → código → QA visual** e ciclo de correção limitado.

O kit separa duas coisas:

- **O procedimento** (como descobrir o Figma, refatorar, implementar, validar e corrigir) é genérico e vem pronto.
- **Os fatos do projeto** (pastas, componentes compartilhados, composables, tokens, tema escuro, rotas, API) ficam
  num único arquivo, `.github/instructions/frontend.instructions.md`, que você preenche em cada projeto.

---

## 1. O fluxo que o kit instala

```
                      ┌──────────────── frontend-agent ────────────────┐
 Link do Figma ──►    │ figma-discovery ──► figma-refactor ──► primevue-│──► npm run verify
 + requisito          │ (.figma-cache/)    (tela existente)  component- │    (vue-tsc + convenções + build)
                      │                                      build      │
                      └────────────────────────┬────────────────────────┘
                                               │ resumo de entrega (arquivos, estados, figma-cache, lacunas)
                                               ▼
                      ┌────────────────── qa-agent ─────────────────────┐
                      │ frontend-visual-check: anterior × atual × Figma │──► qa-results/<run>/findings.md
                      │ (Playwright, mocks de API, claro + escuro)      │    PASS / FAIL / BLOCKED
                      └────────────────────────┬────────────────────────┘
                                               │ só itens "defeito"
                                               ▼
                         frontend-agent (modo correção) ──► qa-agent (recheck)   … no máximo 3 rodadas
                                               │
                                               ▼
                                     vault-write (uma vez, no fim)
```

| Etapa | Quem | O que faz |
|---|---|---|
| Descoberta | `figma-discovery` | Lê o nó no Figma MCP **uma vez**, guarda em `.figma-cache/` e converte os valores em tokens do projeto |
| Delta | `figma-refactor` | Só para tela que já existe: compara com o código e gera o plano (o que mantém, atualiza, cria) |
| Implementação | `primevue-component-build` | Reaproveita componentes compartilhados, confere a API no PrimeVue MCP, usa tokens, `pt`, Tailwind e Lucide |
| Gráficos | `echarts-chart-build` | Gráficos ECharts com tree-shaking e cores por token |
| Responsivo | `mobile-responsive` | Larguras de tablet e celular |
| Validação | `npm run verify` | `vue-tsc` + `check:conventions` (hex, ícones, Bootstrap…) + build |
| QA visual | `qa-agent` + `frontend-visual-check` | Harness Playwright: compara o commit base, o código atual e o Figma, nos temas claro e escuro |
| Orquestração | `create-frontend-ticket`, `task-planner` | Ticket com o ciclo implementar → QA → corrigir; divisão de tarefas entre agentes |
| Memória | `vault-search` / `vault-write` | Vault Obsidian com decisões, mapeamentos Figma→token e componentes (opcional) |

Funciona nos dois hosts: **Claude Code** (`.claude/`, `.mcp.json`) e **GitHub Copilot** (`.github/agents`,
`.vscode/mcp.json`). As skills existem uma vez só em `.github/skills/`; `.claude/skills/` tem apenas symlinks.

---

## 2. O que vem no kit

```
frontend-flow-kit/
  install.sh                 instalador (copia, preenche placeholders, cria symlinks, faz merge do package.json)
  template/                  vai para a raiz do projeto
    .github/instructions/frontend.instructions.md   ← O ARQUIVO A PREENCHER (fatos do projeto)
    .github/instructions/vault.instructions.md
    .github/agents/          frontend-agent, qa-agent, frontend-tooling-specialist (Copilot)
    .github/skills/          figma-discovery, figma-refactor, primevue-component-build, echarts-chart-build,
                             mobile-responsive, frontend-visual-check, create-frontend-ticket, vault-*
    .github/prompts/task-planner.prompt.md
    .claude/agents/          frontend-agent, qa-agent (Claude Code)
    .mcp.json, .vscode/mcp.json                      primevue + figma-mcp + playwright
  clientapp/                 vai para a pasta do front (onde fica o package.json)
    scripts/check-conventions.mjs                    checagem determinística de convenções
    visual/                  harness de QA visual (motor genérico + pontos de adaptação)
    playwright.config.ts, tsconfig.visual.json
  snippets/                  trechos que o instalador acrescenta (CLAUDE.md, copilot-instructions, .gitignore,
                             package.json)
  vault-seed/                esqueleto do vault (índice, tags, template)
```

| Peça | Genérica? | O que adaptar |
|---|---|---|
| Agentes e skills de Figma, build, QA e ticket | Sim | Nada. Eles leem os fatos em `frontend.instructions.md` |
| `frontend.instructions.md` | **Não** | Todas as seções `<!-- ADAPT -->` (ver §5) |
| `check-conventions.mjs` | Regras genéricas prontas | Regras próprias do projeto em `PROJECT_RULES` |
| Harness `visual/` | Motor genérico | `project.json`, `app-setup.ts`, `scenarios/fixtures.ts` e os cenários |
| `mobile-responsive`, `echarts-chart-build` | Quase | O "estado atual" do shell e o gráfico de referência |
| `frontend-tooling-specialist` | Quase | Como o host serve o bundle (ASP.NET, SPA solta…) |
| `task-planner` | Quase | Os agentes de backend do projeto |
| MCPs | Sim | Nada |

---

## 3. Pré-requisitos no projeto de destino

- Repositório git, Node 20+ (testado no 24), `perl`.
- Projeto front-end **Vite + Vue 3 + TypeScript** já criado, com `package.json` e `"type": "module"`. Num projeto
  ASP.NET MVC, o front fica em `<Web>/ClientApp/`, com build em `wwwroot/dist`.
- Claude Code e/ou VS Code com Copilot.
- Acesso ao arquivo do Figma com a conta que vai autenticar o Figma MCP.

### Instalar o stack (se o projeto ainda não tiver)

Na pasta do front:

```bash
npm i vue vue-router primevue @primeuix/themes @lucide/vue
npm i -D vite @vitejs/plugin-vue typescript vue-tsc @types/node tailwindcss @tailwindcss/vite tailwindcss-primeui
npm i echarts                         # se houver gráficos
npm i -D @playwright/test pixelmatch pngjs @types/pngjs && npx playwright install chromium   # harness de QA
```

O `install.sh` já acrescenta ao `package.json` as dependências e scripts que faltam (sem sobrescrever versões que
já existem). Com `--install`, ele também roda `npm install` e `npx playwright install chromium`.

Configuração mínima esperada (o `Frontend-Tooling-Specialist` faz isso se você pedir):

- `vite.config.ts` com `vue()` e `tailwindcss()`.
- `src/style.css` começando com `@import "tailwindcss"; @import "tailwindcss-primeui";` e
  `@source not "../visual";` (o harness de QA nunca pode gerar classes no CSS de produção).
- `src/main.ts` registrando o PrimeVue com o preset do projeto (`definePreset` sobre Aura) e o `vue-router`.

---

## 4. Instalar o kit

Da raiz do repositório onde o kit está:

```bash
# Projeto ASP.NET MVC com ClientApp
./frontend-flow-kit/install.sh ../meu-projeto \
  --name "MeuProjeto" \
  --client-app Src/MeuProjeto.Web/ClientApp \
  --app-url http://localhost:5045 \
  --backend-build "dotnet build Src/MeuProjeto.slnx" \
  --build-output Src/MeuProjeto.Web/wwwroot/dist \
  --images-dir Src/MeuProjeto.Web/wwwroot/images \
  --with-charts --install

# SPA solta (front na raiz ou em frontend/)
./frontend-flow-kit/install.sh ../meu-app --name MeuApp --client-app frontend --no-vault
```

| Opção | Padrão | Uso |
|---|---|---|
| `--name` | obrigatório | Nome que aparece nos agentes, skills e relatório de QA |
| `--client-app` | obrigatório | Pasta do front, relativa à raiz do repositório (`.` se for a raiz) |
| `--app-url` | `http://localhost:5173` | App rodando, para conferência manual e Playwright MCP |
| `--backend-build` | `no backend build` | Comando rodado quando um DTO muda |
| `--build-output` | `<client-app>/dist` | Saída do build |
| `--images-dir` | `<client-app>/public/images` | Imagens exportadas do Figma |
| `--vault-dir` / `--no-vault` | `Docs/Vault/<name>` | Vault Obsidian (ou nenhum) |
| `--no-harness` | — | Sem QA visual (o `qa-agent` fica BLOCKED) |
| `--with-charts` | — | Acrescenta `echarts` |
| `--install` | — | `npm install` + Chromium do Playwright |
| `--force` | — | Sobrescreve arquivos que já existem (por padrão eles são mantidos e listados) |
| `--dry-run` | — | Mostra o que faria, sem escrever nada |

O que o instalador faz:

1. Copia `template/` para a raiz e `clientapp/` para a pasta do front, preenchendo `{{PROJECT_NAME}}`,
   `{{CLIENT_APP_DIR}}`, `{{APP_URL}}`, `{{BACKEND_BUILD_CMD}}`, `{{BUILD_OUTPUT_DIR}}`, `{{IMAGES_DIR}}` e
   `{{VAULT_DIR}}`.
2. Cria os symlinks `.claude/skills/<skill> → ../../.github/skills/<skill>` e
   `.claude/commands/task-planner.md`.
3. Acrescenta uma seção marcada (`<!-- frontend-flow-kit:start -->`) ao `CLAUDE.md` e ao
   `.github/copilot-instructions.md`, criando os arquivos se não existirem.
4. Acrescenta as entradas do `.gitignore` (`.figma-cache/`, `.playwright-mcp/`, `.visual-baseline/`, evidências de
   `qa-results/`).
5. Faz merge do `package.json` (scripts `verify`, `check:conventions`, `visual:*` e dependências), só com o que
   falta.
6. Cria o esqueleto do vault, se a pasta ainda não existir.
7. No fim, lista os arquivos com `ADAPT` pendente e qualquer placeholder não preenchido.

Pode rodar de novo sem medo: o que já existe é mantido e listado.

---

## 5. Depois do install: adaptar ao projeto

Siga nesta ordem. Os agentes só ficam confiáveis depois dos passos 5.1 a 5.3.

### 5.1 `frontend.instructions.md` (obrigatório)

É a única fonte de fatos do projeto para todos os agentes. Preencha cada `<!-- ADAPT -->`:

| Seção | O que escrever |
|---|---|
| Stack | Versões reais, nome e arquivo do preset, fonte |
| Project facts | Como subir o app, rotas → páginas, base da API, formato da resposta paginada e de erro, arquivo de tipos, se o bundle é commitado, idioma da UI, larguras suportadas |
| Folder layout | A árvore real de `src/`, com um comentário por pasta |
| Shared building blocks | Tabela, diálogos, formulários, cabeçalho de página, classes de botão, formatadores. Se não existir, escreva "none yet" para o agente não inventar |
| Data access | Os composables e o contrato de cada um |
| Light and dark themes | O mecanismo: classe ou atributo (`.app-dark`, `.p-dark`, `data-theme`), onde é aplicado antes do primeiro paint, `darkModeSelector`, o composable de tema |
| Figma → code token mapping | A tabela variável do Figma → token Tailwind/PrimeVue do design system |
| Never | Regras proibitivas próprias do projeto |

Dica: peça ao Claude no projeto novo para *"preencher as seções ADAPT de
.github/instructions/frontend.instructions.md lendo o código"*, e revise o resultado.

### 5.2 Tabela de tokens do Figma

É o que faz o `figma-discovery` traduzir o Figma corretamente. Para preencher:

1. Abra um frame representativo e rode `get_variable_defs` pelo Figma MCP (ou peça ao agente).
2. Para cada variável (`surface/700`, `text/muted`…), anote o token equivalente do preset (`surface-700`,
   `text-muted-color`…).
3. Anote também os mapeamentos por componente que já existirem (ex.: "modal do Figma → `dialogShellPt(width)`").

A tabela cresce sozinha: quando o `figma-discovery` acha um valor sem linha, ele marca como **new mapping** e o
`vault-write` registra.

### 5.3 `scripts/check-conventions.mjs`

As regras genéricas já vêm prontas: PrimeIcons, Bootstrap Icons, Bootstrap, hex em classe e em `style`, cores
fixas (`bg-white`, `gray-*`…), prop `icon` em string e `alert()`. Acrescente em `PROJECT_RULES` as regras
mecânicas do seu "Never" (ex.: `darkModeSelector` fixo). Rode `npm run check:conventions` e corrija ou ajuste
até passar.

### 5.4 Harness de QA visual (`visual/`)

O motor (captura, baseline por git worktree, comparação com o Figma, relatório, verdict e recheck) é genérico e
**não deve ser editado**. Os pontos de adaptação são quatro arquivos:

| Arquivo | O que ajustar |
|---|---|
| `visual/project.json` | O instalador preenche `projectName` e `clientAppDir`. Revise `fixedNow` (relógio fixo das capturas), `locale`, `timezone`, `apiBasePath` (tudo abaixo dele é mock ou bloqueado) e `devServerHttps` |
| `visual/app-setup.ts` | **Único arquivo do navegador que conhece o projeto.** Reproduza o que `src/main.ts` e a página host fazem antes de montar o app: CSS global, preset e opções do PrimeVue, locale, como o tema escuro é aplicado (classe, chave no `localStorage`, atributos), fundo do body, plugins globais (Toast, ConfirmationService, i18n) e elementos globais do shell. Os comentários mostram uma variante com tema escuro por superfície invertida como exemplo |
| `visual/scenarios/fixtures.ts` | O formato da resposta paginada da API (`pagedMock`), a query string que o fetch paginado envia e a largura real que uma página recebe ao lado do menu (`pageWidth`) |
| `visual/scenarios/*.ts` | Troque o `example.ts` pelos cenários reais (componente real + mocks de todas as chamadas + irmão escuro) e registre em `scenarios/index.ts`. Snapshots da API vão em `scenarios/fixtures/*.json` |

Para o primeiro cenário, escolha uma página simples, gere o par claro/escuro e rode
`VISUAL_BASELINE_REF=HEAD npm run visual:compare -- <id>-light,<id>-dark`. Se a captura escura sair igual à clara,
o `app-setup.ts` não está aplicando o tema como o app. A partir daí, o próprio `qa-agent` escreve os cenários de
cada entrega.

Limitações conhecidas:

- O harness importa `../vite.config` sem extensão. Se o projeto usa `vite.config.mts` ou `.js`, ajuste o import em
  `visual/vite.config.ts`.
- O `app-setup.ts` também é carregado no commit base. Se ele importar um arquivo de preset que ainda não existia
  nesse commit, a baseline daquela execução fica `absent-at-base` ou bloqueada.
- O texto do relatório e as categorias (`defeito`, `minimas`…) ficam em português, de propósito.

O manual completo do motor está em `visual/README.md`. As armadilhas de medição (PrimeVue, Lucide, meio pixel)
estão em `visual/LEARNINGS.md`.

### 5.5 Demais pontos `ADAPT`

- `mobile-responsive/SKILL.md`: "Current state" do shell (só desktop? como fica a navegação no celular?).
- `echarts-chart-build/SKILL.md`: o gráfico de referência e os tokens de paleta, quando existirem.
- `frontend-tooling-specialist.agent.md`: "Host integration" (como o bundle é servido).
- `task-planner.prompt.md`: os agentes de backend do projeto.

### 5.6 Vault (opcional)

O esqueleto fica em `--vault-dir` (padrão `Docs/Vault/<Nome>`). Abra a pasta no Obsidian se quiser. Depois de
adaptar, peça ao Claude *"rode o vault-full-sync"* para gerar as primeiras notas a partir do código.

---

## 6. Autenticar e conferir os MCPs

| MCP | Claude Code | VS Code / Copilot |
|---|---|---|
| `figma-mcp` (HTTP, OAuth) | `/mcp` → `figma-mcp` → autenticar | Painel MCP → Start → aprovar o login |
| `primevue` (stdio) | Sobe sozinho (`npx @primevue/mcp`, precisa de rede na primeira vez) | Idem |
| `playwright` (stdio) | Sobe sozinho; usa o Chrome instalado | Idem |

Teste rápido no Claude Code: *"use o primevue MCP para listar as seções pt do DataTable"* e *"pegue o metadata
deste nó do Figma: <url>"*. Se o Figma devolver erro de autenticação, refaça o login; os agentes nunca inventam
valores no lugar.

---

## 7. Validar a instalação

Na pasta do front:

```bash
npm run verify               # vue-tsc + check:conventions + build
npm run visual:type-check    # harness compila
npm run visual:test          # contrato de findings/verdict
npm run visual:list          # cenários registrados
VISUAL_BASELINE_REF=HEAD npm run visual:compare -- <id-light>,<id-dark>   # primeira captura real
```

Abra `qa-results/<run>/index.html`: o relatório offline precisa mostrar as abas Light e Dark com as capturas.

No Claude Code, `/agents` deve listar `frontend-agent` e `qa-agent`, e as skills (`figma-discovery`,
`create-frontend-ticket`…) devem aparecer como disponíveis.

---

## 8. Uso no dia a dia

**Refatorar uma tela existente a partir do Figma (pedido direto):**

> Refatore a tela de Pedidos para o Figma <url-do-frame>. Use o frontend-agent e depois valide com o qa-agent.

O `frontend-agent` roda `figma-discovery` → `figma-refactor` → `primevue-component-build` → `npm run verify` e
devolve o resumo de entrega. O `qa-agent` recebe esse resumo e a pasta `.figma-cache/` e gera o `findings.md`.

**Com ticket e ciclo completo (recomendado para telas inteiras):**

> /create-frontend-ticket Refatorar a tela de Pedidos conforme o Figma <url>

Isso gera `ticket-frontend-<slug>.md`. Depois, numa sessão nova (`/clear`):

> Execute o ticket ticket-frontend-pedidos.md

O orquestrador roda o `vault-search` uma vez e chama o `frontend-agent`. Em seguida vem o `qa-agent`, numa
passada exaustiva. Os itens `defeito` voltam para correção, com no máximo 3 rodadas, e o `vault-write` roda
uma vez no fim. As rodadas de correção e recheck usam `model: "sonnet"`.

**Tarefa que cruza backend e front:**

> /task-planner Adicionar o campo Status no pedido e mostrar na tabela e nos diálogos

**Regras que valem sempre:**

- Siga o Figma à risca. Todo desvio aparece em `lacunas` e precisa da aprovação de quem pediu.
- O implementador nunca roda o QA visual, e o QA nunca corrige código.
- O Figma MCP é chamado uma vez por nó; as rodadas seguintes usam `.figma-cache/`.

---

## 9. Manter o kit e os projetos em sincronia

- **O kit é a fonte.** Melhorias no procedimento (uma skill, um agente, o motor do harness) entram primeiro em
  `frontend-flow-kit/` e depois são levadas aos projetos.
- **Atualizar um projeto:** rode `install.sh` com `--dry-run` para ver as diferenças. Depois, com `--force`,
  sobrescreva só o que é genérico. Faça isso num branch e revise o `git diff`. Os arquivos com fatos do projeto
  (`frontend.instructions.md`, `visual/project.json`, `visual/app-setup.ts`, `visual/scenarios/**`) **não** devem
  ser sobrescritos: restaure-os com `git checkout -- <arquivo>` depois do `--force`.
- **Espelhamentos que você mantém à mão em cada projeto:** `.mcp.json` ↔ `.vscode/mcp.json`; os agentes
  `frontend-agent` e `qa-agent` em `.claude/agents/` ↔ `.github/agents/`.

---

## 10. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Agente inventa componente ou prop | Seção "Shared building blocks" vazia | Preencha (ou escreva "none yet") |
| Cores erradas vindas do Figma | Tabela de tokens incompleta, ou o agente usou os hex de fallback | Complete a tabela; o `figma-discovery` precisa usar `get_variable_defs` |
| `qa-agent` BLOCKED | Falta dark sibling, PNG/spec do Figma ou entrada (resumo de entrega) | Veja `bloqueios` no `findings.md` |
| Requisições `/api` bloqueadas no relatório | Mock faltando no cenário | Declare todos os mocks em `mocks` |
| Captura escura igual à clara | `app-setup.ts` não aplica o tema como o app | Reproduza o mecanismo de tema do app |
| Baseline `absent-at-base` | O componente não existe no commit base | Esperado em tela nova; não reprova |
| Figma MCP com erro de auth | OAuth expirado | `/mcp` (Claude) ou painel MCP (VS Code) e autenticar de novo |
| Skill não aparece no Claude Code | Symlink quebrado ou copiado | `ls -l .claude/skills`; recrie com `ln -s ../../.github/skills/<nome>` |
