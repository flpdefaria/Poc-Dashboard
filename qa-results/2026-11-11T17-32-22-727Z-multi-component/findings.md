# Findings QA

status: **BLOCKED**

base: HEAD @ 90c8f9d3b95459f046e6140f9635aa495ae365c8

attempt: 4

## diferencas[]

| id | cenário | elemento/seletor | esperado | atual | categoria | imagem | motivo |
|---|---|---|---|---|---|---|---|
| cars-bulk-delete-dialog-light:6ec9c2b0eb14 | cars-bulk-delete-dialog-light | .p-dialog | PNG do Figma | {"status":"dimension-mismatch","algorithm":"pixelmatch","threshold":0.1,"mismatchTolerance":0.001,"reference":{"width":400,"height":487},"actual":{"width":400,"height":488},"mismatchedPixels":null,"comparedPixels":null,"mismatchRatio":null,"diffImage":null,"sideBySideImage":"comparison/attempt-03/cars-bulk-delete-dialog-light.side-by-side.png","findings":["Dimension mismatch: reference is 400x487, actual is 400x488. No pixel diff was produced — the images were not rescaled, because rescaling would hide the very difference being measured."]} | nao-classificado | [imagem](<actual/attempt-03/cars-bulk-delete-dialog-light.png>) |  |
| cars-create-dialog-light:6ec9c2b0eb14 | cars-create-dialog-light | .p-dialog | PNG do Figma | {"status":"differences","algorithm":"pixelmatch","threshold":0.1,"mismatchTolerance":0.001,"reference":{"width":400,"height":694},"actual":{"width":400,"height":694},"mismatchedPixels":1846,"comparedPixels":277600,"mismatchRatio":0.00664985590778098,"diffImage":"comparison/attempt-03/cars-create-dialog-light.diff.png","sideBySideImage":"comparison/attempt-03/cars-create-dialog-light.side-by-side.png","findings":["1846 of 277600 pixels differ (0.665%), above the 0.100% tolerance at pixelmatch threshold 0.1."]} | nao-classificado | [imagem](<actual/attempt-03/cars-create-dialog-light.png>) |  |
| cars-details-dialog-light:06a0193342ff | cars-details-dialog-light | :scope .p-dialog-footer button:last-child | 98px | 96.83px | nao-classificado | [imagem](<actual/attempt-03/cars-details-dialog-light.png>) |  |
| cars-details-dialog-light:b321cce9e104 | cars-details-dialog-light | :scope .p-dialog-content > section:nth-of-type(1) dl > div:nth-child(3) dd | Roboto Mono | ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace | intencional | [imagem](<actual/attempt-03/cars-details-dialog-light.png>) | Desvio aceito 4: VIN usa a monoespaçada do sistema (font-mono) em vez de Roboto Mono. |
| cars-details-dialog-light:6ec9c2b0eb14 | cars-details-dialog-light | .p-dialog | PNG do Figma | {"status":"differences","algorithm":"pixelmatch","threshold":0.1,"mismatchTolerance":0.001,"reference":{"width":400,"height":508},"actual":{"width":400,"height":508},"mismatchedPixels":2291,"comparedPixels":203200,"mismatchRatio":0.011274606299212599,"diffImage":"comparison/attempt-03/cars-details-dialog-light.diff.png","sideBySideImage":"comparison/attempt-03/cars-details-dialog-light.side-by-side.png","findings":["2291 of 203200 pixels differ (1.127%), above the 0.100% tolerance at pixelmatch threshold 0.1.","Figma spec: 2 property mismatch(es) and 0 missing element(s) out of 105 checks."]} | nao-classificado | [imagem](<actual/attempt-03/cars-details-dialog-light.png>) |  |
| cars-edit-dialog-light:6ec9c2b0eb14 | cars-edit-dialog-light | .p-dialog | PNG do Figma | {"status":"differences","algorithm":"pixelmatch","threshold":0.1,"mismatchTolerance":0.001,"reference":{"width":400,"height":694},"actual":{"width":400,"height":694},"mismatchedPixels":2199,"comparedPixels":277600,"mismatchRatio":0.007921469740634006,"diffImage":"comparison/attempt-03/cars-edit-dialog-light.diff.png","sideBySideImage":"comparison/attempt-03/cars-edit-dialog-light.side-by-side.png","findings":["2199 of 277600 pixels differ (0.792%), above the 0.100% tolerance at pixelmatch threshold 0.1."]} | nao-classificado | [imagem](<actual/attempt-03/cars-edit-dialog-light.png>) |  |
| cars-list-light:2159e0a1c47c | cars-list-light | :scope .p-paginator-page-selected | 400 | 600 | intencional | [imagem](<actual/attempt-03/cars-list-light.png>) | Desvio aceito 2: a página atual fica em negrito (e na cor de texto) para indicar o estado; o Figma desenha todas iguais. |
| cars-list-light:8ba1de45fb6a | cars-list-light | :scope .p-paginator-page-selected | #6b7280 | rgb(31, 41, 55) | intencional | [imagem](<actual/attempt-03/cars-list-light.png>) | Desvio aceito 2: a página atual fica em negrito (e na cor de texto) para indicar o estado; o Figma desenha todas iguais. |
| cars-list-light:6ec9c2b0eb14 | cars-list-light | #preview-root > div | PNG do Figma | {"status":"dimension-mismatch","algorithm":"pixelmatch","threshold":0.1,"mismatchTolerance":0.001,"reference":{"width":1288,"height":734},"actual":{"width":1288,"height":735},"mismatchedPixels":null,"comparedPixels":null,"mismatchRatio":null,"diffImage":null,"sideBySideImage":"comparison/attempt-03/cars-list-light.side-by-side.png","findings":["Dimension mismatch: reference is 1288x734, actual is 1288x735. No pixel diff was produced — the images were not rescaled, because rescaling would hide the very difference being measured.","Figma spec: 2 property mismatch(es) and 0 missing element(s) out of 91 checks."]} | nao-classificado | [imagem](<actual/attempt-03/cars-list-light.png>) |  |
| cars-row-menu-light:6ec9c2b0eb14 | cars-row-menu-light | .p-menu-overlay | PNG do Figma | {"status":"dimension-mismatch","algorithm":"pixelmatch","threshold":0.1,"mismatchTolerance":0.001,"reference":{"width":175,"height":78},"actual":{"width":175,"height":79},"mismatchedPixels":null,"comparedPixels":null,"mismatchRatio":null,"diffImage":null,"sideBySideImage":"comparison/attempt-04/cars-row-menu-light.side-by-side.png","findings":["Dimension mismatch: reference is 175x78, actual is 175x79. No pixel diff was produced — the images were not rescaled, because rescaling would hide the very difference being measured."]} | nao-classificado | [imagem](<actual/attempt-04/cars-row-menu-light.png>) |  |
| cars-row-selected-light:991e5652c906 | cars-row-selected-light | :scope .p-button-danger.p-button-outlined | #b91c1c | rgb(239, 68, 68) | intencional | [imagem](<actual/attempt-03/cars-row-selected-light.png>) | Desvio aceito 3: texto do botão de exclusão em massa usa o vermelho padrão do PrimeVue (outlined danger) em vez de #b91c1c. |
| cars-row-selected-light:87ee9ffb7ca9 | cars-row-selected-light | :scope .p-datatable-tbody > tr:first-child | #d7e6fe | rgb(229, 231, 235) | intencional | [imagem](<actual/attempt-03/cars-row-selected-light.png>) | Desvio aceito 1: linha selecionada usa --p-soft-background do app em vez do azul #d7e6fe do Figma. |
| cars-row-selected-light:f3650099717e | cars-row-selected-light | :scope .p-datatable-tbody > tr:first-child > td:nth-child(2) | #1046a0 | rgb(17, 24, 39) | intencional | [imagem](<actual/attempt-03/cars-row-selected-light.png>) | Desvio aceito 1: tinta da linha selecionada = --p-soft-color do app em vez de #1046a0. |
| cars-row-selected-light:838f53751f73 | cars-row-selected-light | :scope .p-datatable-tbody > tr:first-child .p-checkbox | 18px | 20px | intencional | [imagem](<actual/attempt-03/cars-row-selected-light.png>) | Desvio aceito 5: checkbox Aura de 20px em vez de 18px. |
| cars-row-selected-light:9aa0ba6709c5 | cars-row-selected-light | :scope .p-datatable-tbody > tr:first-child .p-checkbox | 18px | 20px | intencional | [imagem](<actual/attempt-03/cars-row-selected-light.png>) | Desvio aceito 5: checkbox Aura de 20px em vez de 18px. |
| cars-row-selected-light:da12c7a20272 | cars-row-selected-light | :scope .p-datatable-tbody > tr:first-child .p-checkbox-box | #2564cf | rgb(31, 41, 55) | intencional | [imagem](<actual/attempt-03/cars-row-selected-light.png>) | Desvio aceito 1: checkbox marcado usa a cor primária do app em vez do azul #2564cf. |
| cars-row-selected-light:6ec9c2b0eb14 | cars-row-selected-light | #preview-root > div | PNG do Figma | {"status":"dimension-mismatch","algorithm":"pixelmatch","threshold":0.1,"mismatchTolerance":0.001,"reference":{"width":1288,"height":734},"actual":{"width":1288,"height":735},"mismatchedPixels":null,"comparedPixels":null,"mismatchRatio":null,"diffImage":null,"sideBySideImage":"comparison/attempt-03/cars-row-selected-light.side-by-side.png","findings":["Dimension mismatch: reference is 1288x734, actual is 1288x735. No pixel diff was produced — the images were not rescaled, because rescaling would hide the very difference being measured.","Figma spec: 6 property mismatch(es) and 0 missing element(s) out of 52 checks."]} | nao-classificado | [imagem](<actual/attempt-03/cars-row-selected-light.png>) |  |

## minimas[]

Semelhantes por julgamento registrado; não geram correção.

| id | cenário | elemento/seletor | esperado | atual | categoria | imagem | motivo |
|---|---|---|---|---|---|---|---|


## bloqueios

- Julgamento QA pendente: registrar critérios e revisão visual com visual:verdict.
- cars-bulk-delete-dialog-light:6ec9c2b0eb14: diferença sem classificação.
- cars-create-dialog-light:6ec9c2b0eb14: diferença sem classificação.
- cars-details-dialog-light:06a0193342ff: diferença sem classificação.
- cars-details-dialog-light:6ec9c2b0eb14: diferença sem classificação.
- cars-edit-dialog-light:6ec9c2b0eb14: diferença sem classificação.
- cars-list-light:6ec9c2b0eb14: diferença sem classificação.
- cars-row-menu-light:6ec9c2b0eb14: diferença sem classificação.
- cars-row-selected-light:6ec9c2b0eb14: diferença sem classificação.

[Relatório offline](index.html) · [Medições e julgamento](report.json)
