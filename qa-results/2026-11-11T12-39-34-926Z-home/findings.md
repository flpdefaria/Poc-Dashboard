# Findings QA

status: **PASS**

base: HEAD @ 85c800fbfd7dd79cfae10e4300e3d523cf08e8ce

attempt: 9

## diferencas[]

| id | cenário | elemento/seletor | esperado | atual | categoria | imagem | motivo |
|---|---|---|---|---|---|---|---|
| home-dashboard-light:6ec9c2b0eb14 | home-dashboard-light | #preview-root > .home-ready | PNG do Figma | {"status":"differences","algorithm":"pixelmatch","threshold":0.1,"mismatchTolerance":0.001,"reference":{"width":1288,"height":1075},"actual":{"width":1288,"height":1075},"mismatchedPixels":14304,"comparedPixels":1384600,"mismatchRatio":0.010330781453127257,"diffImage":"comparison/attempt-09/home-dashboard-light.diff.png","sideBySideImage":"comparison/attempt-09/home-dashboard-light.side-by-side.png","findings":["14304 of 1384600 pixels differ (1.033%), above the 0.100% tolerance at pixelmatch threshold 0.1."]} | conteudo-dinamico | [imagem](<comparison/attempt-09/home-dashboard-light.diff.png>) | 1,03% dos pixels, revisado por zoom em cada área. (1) Conteúdo do fixture: 4 datas da tabela seguem a série do gráfico do protótipo, que contradiz as datas desenhadas na tabela (06/10, 03/09, 29/09, 27/08 em vez de 06/11, 03/11, 29/10, 27/10). (2) Rasterização Figma × Chromium do Inter: mesmos glifos e tamanhos, deslocados 1-3px (92%, 15, rótulos do SelectButton e do gráfico). O nó do gráfico no Figma tem 828px e transborda o contêiner de 826px, deslocando ~2px a última barra e o rótulo nov. Nenhum elemento faltando, texto da UI errado, cor, tamanho ou overflow: o spec passa 140/140. |

## minimas[]

Semelhantes por julgamento registrado; não geram correção.

| id | cenário | elemento/seletor | esperado | atual | categoria | imagem | motivo |
|---|---|---|---|---|---|---|---|


## bloqueios

Nenhum.

[Relatório offline](index.html) · [Medições e julgamento](report.json)
