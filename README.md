# Leal Festas & Decorações — MVP do site

Site estático em HTML/CSS/JavaScript, pronto para GitHub + Render.

## O que já funciona

- Página responsiva (desktop e mobile)
- Animação de entrada com balões e confetes
- Catálogo por categorias e busca
- Modal com galeria e detalhes do item
- Favoritos persistidos no navegador
- Carrinho de orçamento persistido no navegador
- Quantidade por item
- Confete ao adicionar ao carrinho e ao finalizar
- Envio **direto** do carrinho para o WhatsApp, sem formulário intermediário
- Mensagem do WhatsApp já preenchida com itens, quantidades e preços de referência
- Produtos em destaque
- Itens publicados/ocultos via `ativo: true/false`
- Ferramenta Admin para editar o catálogo e gerar um novo `catalogo.js`

## 1) Configure os contatos

Abra `js/config.js` e altere, principalmente:

```js
whatsapp: "5521999999999",
instagram: "https://instagram.com/seuperfil",
areaAtendimento: "Sua cidade e região"
```

No WhatsApp use somente números: DDI + DDD + número.

## 2) Fluxo do orçamento

O botão do carrinho **Enviar orçamento pelo WhatsApp** não pede nome, telefone, data ou endereço. Ele abre imediatamente o WhatsApp com uma mensagem semelhante a:

```text
Olá! Gostaria de solicitar um orçamento na Leal Festas & Decorações 🎉

🛒 Itens selecionados:
• 1x Kit Safari — R$ 249,90/kit
• 2x Arco Orgânico de Balões — R$ 180,00/serviço

Gostaria de verificar disponibilidade e o valor final.
```

O restante das informações pode ser levantado durante a conversa.

## 3) Admin do catálogo

Abra:

```text
admin/index.html
```

ou, usando o servidor local:

```text
http://localhost:5500/admin/
```

No Admin você pode:

- adicionar e excluir itens;
- editar nome, categoria, preço, descrição e unidade;
- publicar/ocultar;
- marcar como destaque;
- mudar a ordem dos produtos;
- editar o que está incluído;
- cadastrar fotos e variantes 800 / 1800 / 2560 px;
- baixar um `catalogo.js` novo.

As alterações do Admin ficam em um rascunho no navegador. Quando terminar, clique em **Baixar catalogo.js**, substitua o arquivo `data/catalogo.js` do projeto pelo arquivo baixado e faça o push para o GitHub.

> A página Admin não contém token do GitHub e não publica diretamente. Isso evita colocar credenciais sensíveis dentro do site público.

## 4) Organização recomendada das fotos reais

```text
public/images/
├── kits/
│   ├── safari/
│   │   ├── capa-800.webp
│   │   ├── capa-1800.webp
│   │   └── capa-2560.webp
│   └── princesa/
├── baloes/
├── estrutura/
└── servicos/
```

As imagens demonstrativas atuais ficam em `public/images/demo/`. Nos produtos reais use `demo: false` para retirar o selo “Imagem demo”.

## 5) Qualidade das fotos

Mantenha a foto original fora do GitHub (Drive/HD). Para o site:

- miniatura: 800 px, WebP, qualidade alta;
- principal: 1800–2000 px, WebP, qualidade 90–92%;
- ampliada: 2560 px, WebP, qualidade 90–92%.

O site entende `variantes.sm`, `variantes.md` e `variantes.xl`, permitindo ao navegador carregar uma resolução adequada para cada tela sem sacrificar a qualidade da galeria.

## 6) Teste local

Você pode abrir `index.html` diretamente. Para testar o site e o Admin em localhost, execute na pasta do projeto:

```bash
python -m http.server 5500
```

Depois abra:

```text
http://localhost:5500
```

Admin:

```text
http://localhost:5500/admin/
```

## 7) Atualização no GitHub

Depois de substituir fotos ou `data/catalogo.js`:

```powershell
git add .
git commit -m "Atualiza catálogo Leal Festas"
git push
```

O Render pode fazer o novo deploy automaticamente após o push.

## Render

- Service type: **Static Site**
- Branch: `main`
- Build Command: `echo "No build required"` (ou vazio, se permitido)
- Publish Directory: `.`

## Observações

Os preços atuais são demonstrativos. Troque-os antes de publicar comercialmente.
O carrinho é um **carrinho de orçamento**, não um checkout de pagamento.
