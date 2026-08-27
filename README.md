# Leal D’Coração — Atualização v7 (Admin de fotos)

Esta atualização corrige o fluxo de fotos do Admin.

## O que mudou

- No Admin online do Render, ao otimizar fotos, o site baixa **um único ZIP** (`fotos-ID-DO-PRODUTO.zip`) em vez de vários WebP separados.
- O ZIP já contém a estrutura correta: `public/images/catalogo/ID-DO-PRODUTO/`.
- Basta extrair o ZIP sobre a pasta raiz `leal-festas-site`.
- O botão **Adicionar fotos prontas** agora abre o seletor de arquivos.
- Ele reconhece automaticamente arquivos `-800.webp`, `-1800.webp` e `-2560.webp` e agrupa as variantes da mesma foto.
- A gravação direta na pasta do projeto continua disponível quando o navegador permitir `showDirectoryPicker`.

## Como aplicar

Extraia este patch sobre a pasta `leal-festas-site` e aceite substituir os arquivos.

Depois:

```powershell
git add .
git commit -m "Melhora fluxo de fotos do Admin"
git push
```

## Fluxo recomendado no Admin online

1. Abra o produto.
2. Clique em **Otimizar fotos originais**.
3. Selecione as fotos originais.
4. Se o navegador não permitir gravação direta, será baixado `fotos-ID.zip`.
5. Extraia esse ZIP sobre `leal-festas-site`.
6. No Admin, salve o item e baixe `catalogo.js`.
7. Substitua `data/catalogo.js`.
8. Faça `git add`, `commit` e `push`.
