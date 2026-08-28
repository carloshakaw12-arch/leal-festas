# Atualização V10 — seleção automática de foto válida

Esta atualização corrige o caso em que o catálogo/modal começa com um slot de imagem inválido e só mostra a foto real depois de clicar na miniatura.

## O que muda
- O card do catálogo testa todas as fotos/variantes do produto e usa automaticamente a primeira que carregar.
- O modal faz a mesma seleção automática ao abrir.
- Não é mais necessário clicar na miniatura para a foto principal aparecer.
- Variantes 2560/1800/800 continuam sendo tratadas como a mesma foto.
- Miniaturas inválidas ficam ocultas.
- Se só uma foto válida restar, a faixa de miniaturas é escondida.
- Mantém a correção da intro de balões/confetes da V9.
- Cache atualizado para v10.

## Aplicar
Extraia por cima da pasta `leal-festas-site`, aceitando substituir os arquivos.

Depois:
```powershell
git add .
git commit -m "Corrige selecao automatica das fotos"
git push
```

Não é necessário subir novamente a foto que já aparece ao clicar na miniatura.
