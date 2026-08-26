# Leal Festas & Decorações — MVP do site

Site estático em HTML/CSS/JavaScript, pronto para GitHub + Render.

## O que já funciona

- Página responsiva (desktop e mobile)
- Animação de entrada com balões e confetes
- Catálogo por categorias
- Busca por nome/descrição
- Modal com galeria e detalhes do item
- Favoritos persistidos no navegador
- Carrinho de orçamento persistido no navegador
- Quantidade por item
- Confete ao adicionar ao carrinho e ao finalizar
- Formulário de data/local/nome/telefone/observações
- Geração automática da mensagem do pedido
- Envio por WhatsApp (`wa.me`)
- Opção de e-mail (`mailto:`)
- Opção de copiar resumo do pedido
- Produtos em destaque
- Itens publicados/ocultos via `ativo: true/false`

## 1) Configure os contatos

Abra `js/config.js` e altere:

```js
whatsapp: "5521999999999",
email: "contato@exemplo.com",
instagram: "https://instagram.com/seuperfil",
areaAtendimento: "Sua cidade e região"
```

No WhatsApp use somente números: DDI + DDD + número.

## 2) Gerencie o catálogo

Abra `data/catalogo.js`.

Cada produto possui esta estrutura:

```js
{
  id: "kit-safari",
  nome: "Kit Safari",
  categoria: "kits",
  categoriaNome: "Kits de Festa",
  preco: 249.90,
  unidade: "kit",
  destaque: true,
  ativo: true,
  demo: false,
  descricao: "Descrição do kit...",
  inclui: ["Painel", "Mesas", "Bandejas"],
  imagens: [
    {
      src: "public/images/kits/safari/capa-1800.webp",
      variantes: {
        sm: "public/images/kits/safari/capa-800.webp",
        md: "public/images/kits/safari/capa-1800.webp",
        xl: "public/images/kits/safari/capa-2560.webp"
      },
      alt: "Kit Safari completo"
    }
  ]
}
```

### Para ocultar um produto

```js
ativo: false
```

### Para destacar um produto

```js
destaque: true
```

## 3) Organização recomendada das fotos reais

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

As imagens demonstrativas atuais ficam em `public/images/demo/` e devem ser substituídas. Nos produtos reais use `demo: false` para remover automaticamente o selo “Imagem demo”.

O site já entende `variantes.sm`, `variantes.md` e `variantes.xl` e deixa o navegador escolher a resolução adequada para a tela.

## 4) Qualidade das fotos

Mantenha a foto original fora do GitHub (Drive/HD). Para o site, a recomendação é:

- miniatura: 800 px, WebP, qualidade alta
- principal: 1800–2000 px, WebP, qualidade 90–92%
- ampliada: 2560 px, WebP, qualidade 90–92%

O objetivo é otimizar sem perda visual perceptível.

## 5) Teste local

Este projeto não precisa de build. Você pode abrir `index.html` diretamente no navegador.

Também pode executar um servidor local:

```bash
python -m http.server 5500
```

Depois abra `http://localhost:5500`.

## 6) Render

Como é um site estático sem build:

- Service type: **Static Site**
- Branch: `main`
- Build Command: pode deixar vazio (se a interface exigir um comando, use `echo "No build required"`)
- Publish Directory: `.`

Cada push na branch vinculada pode disparar um novo deploy automático.

## Observações

Os preços do catálogo são demonstrativos. Troque todos antes de publicar.
O carrinho é um **carrinho de orçamento**, não um checkout de pagamento.
