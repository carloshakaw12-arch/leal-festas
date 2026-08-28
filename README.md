# Leal D’Coração — Atualização v8 (galeria/fotos)

Corrige o comportamento das fotos no Admin e no site:

- 800/1800/2560 passam a ser tratados como **3 resoluções da mesma foto**, nunca 3 fotos distintas.
- O Admin online mostra uma prévia local imediatamente após otimizar/selecionar, mesmo antes dos arquivos existirem no Render.
- Ao adicionar a primeira foto real, imagens de demonstração (`/demo/`) são removidas automaticamente do produto.
- O site também agrupa automaticamente catálogos antigos que tenham 800/1800/2560 cadastrados separadamente.
- Se um produto tiver apenas 1 foto real, a faixa de miniaturas é ocultada.
- Com 2 ou mais fotos reais, aparece uma miniatura por foto original, não por resolução.

## Aplicação
Extraia sobre a raiz `leal-festas-site`, substituindo:
- `admin/admin.js`
- `js/app.js`

Depois:
```powershell
git add .
git commit -m "Corrige galeria e variantes de fotos"
git push
```
