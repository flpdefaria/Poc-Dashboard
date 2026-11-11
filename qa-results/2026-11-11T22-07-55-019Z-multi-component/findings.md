# Findings QA

status: **PASS**

base: HEAD @ 1a5ddb331703e2f8bbe7a9a585b8cb3e148f0776

attempt: 1

## diferencas[]

| id | cenário | elemento/seletor | esperado | atual | categoria | imagem | motivo |
|---|---|---|---|---|---|---|---|


## minimas[]

Semelhantes por julgamento registrado; não geram correção.

| id | cenário | elemento/seletor | esperado | atual | categoria | imagem | motivo |
|---|---|---|---|---|---|---|---|
| home-dashboard-light:6ec9c2b0eb14 | home-dashboard-light | #preview-root > .home-ready | PNG do Figma | {"status":"differences","algorithm":"pixelmatch","threshold":0.1,"mismatchTolerance":0.001,"reference":{"width":1288,"height":1075},"actual":{"width":1288,"height":1075},"mismatchedPixels":14304,"comparedPixels":1384600,"mismatchRatio":0.010330781453127257,"diffImage":"comparison/attempt-01/home-dashboard-light.diff.png","sideBySideImage":"comparison/attempt-01/home-dashboard-light.side-by-side.png","findings":["14304 of 1384600 pixels differ (1.033%), above the 0.100% tolerance at pixelmatch threshold 0.1."]} | intencional | [imagem](<comparison/attempt-01/home-dashboard-light.diff.png>) | Home idêntica ao HEAD (0 px vs base) e spec Figma 0 falhas; os 1,03% de diferença de pixel contra o PNG Figma são preexistentes (anti-aliasing/fonte), fora do escopo desta entrega. Mesma leitura do bundle 2026-11-11T18-37-24-682Z. |

## bloqueios

Nenhum.

[Relatório offline](index.html) · [Medições e julgamento](report.json)
