# Leal D’Coração — Admin v11 simplificado

## O que mudou

O fluxo do Admin foi reduzido para duas ações principais:

1. Edite os dados dos produtos e selecione as fotos originais de cada produto.
2. No final, clique em **Baixar atualização completa**.

As alterações de texto/preço/status são salvas automaticamente no navegador.

O ZIP gerado pelo Admin contém, em um único pacote:

- `data/catalogo.js`
- `public/images/catalogo/<id-do-produto>/...-800.webp`
- `public/images/catalogo/<id-do-produto>/...-1800.webp`
- `public/images/catalogo/<id-do-produto>/...-2560.webp`

Selecione **todas as fotos que deseja manter** em cada produto. Se você não selecionar novas fotos para um produto, a galeria existente é preservada.

## Publicação

1. Extraia o ZIP gerado pelo Admin sobre a raiz `leal-festas-site`.
2. Aceite substituir os arquivos.
3. Rode:

```powershell
git add .
git commit -m "Atualiza catalogo e fotos Leal D Coracao"
git push
```

## Observação importante

As fotos originais selecionadas ficam apenas na memória da aba do Admin, pois o navegador não pode guardá-las em `localStorage`. Gere o pacote antes de fechar/recarregar a página. O Admin avisa caso você tente sair com fotos pendentes.
