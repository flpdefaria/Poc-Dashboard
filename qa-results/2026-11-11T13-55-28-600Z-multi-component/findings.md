# Findings QA

status: **BLOCKED**

base: HEAD @ f8f75f2ef42d626cbfb69be1808c3b6c8e17baaa

attempt: 2

## diferencas[]

| id | cenário | elemento/seletor | esperado | atual | categoria | imagem | motivo |
|---|---|---|---|---|---|---|---|
| home-dashboard-light:6ec9c2b0eb14 | home-dashboard-light | #preview-root > .home-ready | PNG do Figma | {"status":"differences","algorithm":"pixelmatch","threshold":0.1,"mismatchTolerance":0.001,"reference":{"width":1288,"height":1075},"actual":{"width":1288,"height":1075},"mismatchedPixels":14304,"comparedPixels":1384600,"mismatchRatio":0.010330781453127257,"diffImage":"comparison/attempt-01/home-dashboard-light.diff.png","sideBySideImage":"comparison/attempt-01/home-dashboard-light.side-by-side.png","findings":["14304 of 1384600 pixels differ (1.033%), above the 0.100% tolerance at pixelmatch threshold 0.1."]} | nao-classificado | [imagem](<actual/attempt-01/home-dashboard-light.png>) |  |

## minimas[]

Semelhantes por julgamento registrado; não geram correção.

| id | cenário | elemento/seletor | esperado | atual | categoria | imagem | motivo |
|---|---|---|---|---|---|---|---|


## bloqueios

- Julgamento QA pendente: registrar critérios e revisão visual com visual:verdict.
- home-dashboard-light:6ec9c2b0eb14: diferença sem classificação.

[Relatório offline](index.html) · [Medições e julgamento](report.json)
