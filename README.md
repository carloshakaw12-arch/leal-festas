# Leal D’Coração — atualização v6

Extraia este ZIP diretamente dentro da pasta `leal-festas-site` e aceite substituir os arquivos.

## Esta atualização NÃO substitui
- `js/config.js` — seu número de WhatsApp continua intacto.
- `data/catalogo.js` — seu catálogo atual continua intacto.
- suas fotos atuais.

## Contatos configurados na interface
- Instagram: @lealdcoracao
- E-mail: lealmirielen@gmail.com
- Região: Guapimirim - RJ

## Melhorias
1. “O que está incluso” ganhou destaque visual no modal do produto.
2. “Combine com” sugere até 3 complementos. Sem configuração, as sugestões são automáticas; no Admin você pode informar os IDs desejados.
3. Meta Pixel preparado com eventos ViewContent, AddToCart, OpenCart, InitiateCheckout e Contact. Ele permanece desligado até preencher `js/analytics.js` com o ID do Pixel.
4. Admin: “Otimizar fotos originais” gera WebP 800/1800/2560 em qualidade 0.92. No Edge/Chrome, escolha a raiz `leal-festas-site` para gravar direto em `public/images/catalogo/<id>/`.

## Git
Depois de extrair:
```
git add .
git commit -m "Atualiza site Leal D Coracao v6"
git push
```
