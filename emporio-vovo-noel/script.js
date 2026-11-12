/* Empório da Vovó Noel - JavaScript corrigido */
"use strict";

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];
const formatarPreco = (valor) => Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const catalogo = Array.isArray(window.produtos) ? window.produtos : [];

// Cria uma ilustração de reserva quando algum arquivo de imagem não existe.
function imagemReserva(nome = "Produto de Natal", categoria = "") {
  const emojis = {
    "Panetones e Chocotones": "🍞", "Biscoitos": "🍪", "Bolos e Tortas": "🍰",
    "Cestas e Kits": "🎁", "Bebidas e Chocolates": "☕"
  };
  const emoji = emojis[categoria] || "🎄";
  const titulo = String(nome).replace(/[&<>"']/g, " ").slice(0, 32);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><defs><linearGradient id="f" x2="0" y2="1"><stop stop-color="#fff8e8"/><stop offset="1" stop-color="#ead5ad"/></linearGradient></defs><rect width="640" height="480" fill="url(#f)"/><circle cx="320" cy="190" r="125" fill="#fff" stroke="#b88b42" stroke-width="9"/><text x="320" y="235" text-anchor="middle" font-size="145">${emoji}</text><text x="320" y="385" text-anchor="middle" font-family="Georgia,serif" font-size="29" font-weight="bold" fill="#713c26">${titulo}</text><text x="320" y="425" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" fill="#54704a">Empório da Vovó Noel</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function configurarImagens(raiz = document) {
  $$('img', raiz).forEach((img) => {
    if (img.dataset.fallbackConfigurado) return;
    img.dataset.fallbackConfigurado = "sim";
    img.addEventListener("error", () => {
      if (img.dataset.usouReserva) return;
      img.dataset.usouReserva = "sim";
      img.src = imagemReserva(img.alt || "Produto de Natal", img.dataset.categoria || "");
    });
  });
}

// Animação de entrada sem impedir o site de funcionar em navegadores antigos.
function observarElementos() {
  const elementos = $$('.revelar:not(.visivel)');
  if (!("IntersectionObserver" in window)) {
    elementos.forEach((el) => el.classList.add("visivel"));
    return;
  }
  const observador = new IntersectionObserver((entradas, obs) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add("visivel");
        obs.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.08 });
  elementos.forEach((el) => observador.observe(el));
}

function criarCard(p) {
  return `<article class="card revelar">
    <img src="${p.imagem}" alt="${p.nome}" data-categoria="${p.categoria}" data-id="${p.id}" loading="lazy">
    <div class="card-corpo"><span class="etiqueta">${p.categoria}</span>
      <h3 class="abrir-produto" data-id="${p.id}">${p.nome}</h3><p>${p.descricao}</p>
      <div class="rodape-card"><strong class="preco">${formatarPreco(p.preco)}</strong>
      <button class="btn-comprar botao" data-id="${p.id}" type="button">Adicionar</button></div>
    </div></article>`;
}

function mostrarProdutos(lista, area) {
  if (!area) return;
  area.innerHTML = lista.length ? lista.map(criarCard).join("") : '<p class="vazio">🎄 Nenhum produto encontrado. Tente outra busca!</p>';
  configurarImagens(area);
  observarElementos();
}

// Página de produtos: busca e filtro por categoria.
const areaProdutos = $("#lista-produtos");
if (areaProdutos) {
  const busca = $("#busca");
  const seletor = $("#categoria");
  const contador = $("#contador");
  if (seletor) {
    [...new Set(catalogo.map((p) => p.categoria))].forEach((categoria) => {
      const opcao = document.createElement("option");
      opcao.value = categoria;
      opcao.textContent = categoria;
      seletor.appendChild(opcao);
    });
  }
  const filtrar = () => {
    const texto = (busca?.value || "").toLocaleLowerCase("pt-BR").trim();
    const categoria = seletor?.value || "todas";
    const resultado = catalogo.filter((p) =>
      p.nome.toLocaleLowerCase("pt-BR").includes(texto) && (categoria === "todas" || p.categoria === categoria)
    );
    mostrarProdutos(resultado, areaProdutos);
    if (contador) contador.textContent = `Mostrando ${resultado.length} de ${catalogo.length} produtos`;
  };
  busca?.addEventListener("input", filtrar);
  seletor?.addEventListener("change", filtrar);
  filtrar();
}

// Produtos em destaque na página inicial.
const destaques = $("#destaques");
if (destaques) mostrarProdutos(catalogo.filter((p) => p.destaque), destaques);

// Galeria: usa os produtos do catálogo, evitando caminhos digitados separadamente.
const areaGaleria = $("#galeria-produtos");
if (areaGaleria) {
  const itensGaleria = catalogo;
  areaGaleria.innerHTML = itensGaleria.map((p) => `<figure class="item-galeria">
    <button type="button" class="abrir-galeria" data-id="${p.id}" aria-label="Ampliar ${p.nome}">
      <img src="${p.imagem}" alt="${p.nome}" data-categoria="${p.categoria}" loading="lazy">
    </button><figcaption>${p.nome}</figcaption></figure>`).join("");
  configurarImagens(areaGaleria);
}

// Carrinho com leitura segura do armazenamento local.
let carrinho = [];
try {
  const salvo = JSON.parse(localStorage.getItem("carrinho") || "[]");
  if (Array.isArray(salvo)) carrinho = salvo.map(Number).filter((id) => catalogo.some((p) => p.id === id));
} catch (_) { carrinho = []; }

function atualizarCarrinho() {
  const itens = carrinho.map((id) => catalogo.find((p) => p.id === id)).filter(Boolean);
  try { localStorage.setItem("carrinho", JSON.stringify(carrinho)); } catch (_) {}
  const quantidade = $("#qtd-carrinho");
  const totalTopo = $("#total-carrinho");
  const totalPainel = $("#total-painel");
  const lista = $("#itens-carrinho");
  const total = itens.reduce((soma, p) => soma + Number(p.preco), 0);
  if (quantidade) quantidade.textContent = itens.length;
  if (totalTopo) totalTopo.textContent = formatarPreco(total);
  if (totalPainel) totalPainel.textContent = formatarPreco(total);
  if (lista) {
    lista.innerHTML = itens.length ? itens.map((p, i) => `<li>
      <img src="${p.imagem}" alt="${p.nome}" data-categoria="${p.categoria}">
      <span>${p.nome}<br><b>${formatarPreco(p.preco)}</b></span>
      <button class="remover" data-i="${i}" aria-label="Remover ${p.nome}" type="button">✕</button>
    </li>`).join("") : "<li>Seu cesto está vazio. 🎁</li>";
    configurarImagens(lista);
  }
}

// Modal usado pelos cards e pela galeria.
const modal = $("#modal");
function abrirModal(html) {
  const corpo = $("#modal-corpo");
  if (!modal || !corpo) return;
  corpo.innerHTML = html;
  modal.hidden = false;
  configurarImagens(corpo);
}
function fecharModal() { if (modal) modal.hidden = true; }

function tocarSino() {
  const sino = new Audio("audio/sino.wav");
  sino.volume = 0.35;
  sino.play().catch(() => {});
}

// Eventos gerais: cada elemento é verificado antes de receber ações.
document.addEventListener("click", (evento) => {
  const alvo = evento.target;
  if (!(alvo instanceof Element)) return;

  const botaoComprar = alvo.closest(".btn-comprar");
  if (botaoComprar) {
    const id = Number(botaoComprar.dataset.id);
    if (catalogo.some((p) => p.id === id)) { carrinho.push(id); atualizarCarrinho(); tocarSino(); }
    return;
  }

  const botaoGaleria = alvo.closest(".abrir-galeria");
  const imagemCard = alvo.closest(".card img, .card .abrir-produto");
  if (botaoGaleria || imagemCard) {
    const id = Number((botaoGaleria || imagemCard).dataset.id);
    const p = catalogo.find((produto) => produto.id === id);
    if (p) abrirModal(`<img class="imagem-ampliada" src="${p.imagem}" alt="${p.nome}" data-categoria="${p.categoria}"><h3>${p.nome}</h3><p>${p.descricao}</p><p><b>${formatarPreco(p.preco)}</b> · ${p.categoria}</p><button class="btn-comprar botao" data-id="${p.id}" type="button">Adicionar ao cesto</button>`);
    return;
  }

  if (alvo === modal || alvo.closest(".fechar-modal")) { fecharModal(); return; }
  const remover = alvo.closest(".remover");
  if (remover) { carrinho.splice(Number(remover.dataset.i), 1); atualizarCarrinho(); return; }
  if (alvo.closest("#abrir-carrinho")) { $("#painel-carrinho")?.classList.toggle("aberto"); return; }
  if (alvo.closest("#fechar-carrinho")) { $("#painel-carrinho")?.classList.remove("aberto"); return; }
  if (alvo.closest("#limpar-carrinho")) { carrinho = []; atualizarCarrinho(); return; }
  if (alvo.closest("#finalizar")) {
    const mensagem = $("#msg-carrinho");
    if (mensagem) mensagem.textContent = carrinho.length ? "🎅 Obrigado! Esta é uma loja fictícia; nenhum pedido real foi feito." : "Coloque algum produto no cesto primeiro.";
  }
});

document.addEventListener("keydown", (evento) => { if (evento.key === "Escape") fecharModal(); });

// Música: o navegador só permite iniciar depois de uma ação do visitante.
const botaoMusica = $("#btn-musica");
let musica = null;
if (botaoMusica) {
  musica = new Audio("audio/musica-natal.wav");
  musica.loop = true;
  musica.volume = 0.2;
  botaoMusica.addEventListener("click", async () => {
    if (musica.paused) {
      try { await musica.play(); botaoMusica.textContent = "🔇 Pausar música"; }
      catch (_) { botaoMusica.textContent = "Música indisponível"; }
    } else { musica.pause(); botaoMusica.textContent = "🎵 Tocar música"; }
  });
}

// Slideshow da página inicial.
const slides = $$(".slide");
const indicadores = $("#indicadores");
if (slides.length && indicadores) {
  let atual = 0;
  indicadores.innerHTML = "";
  slides.forEach((_, indice) => {
    const ponto = document.createElement("button");
    ponto.type = "button";
    ponto.className = "ponto";
    ponto.setAttribute("aria-label", `Mostrar slide ${indice + 1}`);
    ponto.addEventListener("click", () => mostrarSlide(indice));
    indicadores.appendChild(ponto);
  });
  function mostrarSlide(indice) {
    atual = (indice + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle("ativo", i === atual));
    [...indicadores.children].forEach((ponto, i) => ponto.classList.toggle("ativo", i === atual));
  }
  $("#proximo")?.addEventListener("click", () => mostrarSlide(atual + 1));
  $("#anterior")?.addEventListener("click", () => mostrarSlide(atual - 1));
  mostrarSlide(0);
  window.setInterval(() => mostrarSlide(atual + 1), 5000);
}

// Efeito parallax.
const camadas = $$('[data-velocidade]');
if (camadas.length) {
  let agendado = false;
  window.addEventListener("scroll", () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => {
      camadas.forEach((camada) => {
        camada.style.transform = `translateY(${window.scrollY * Number(camada.dataset.velocidade || 0)}px)`;
      });
      agendado = false;
    });
  }, { passive: true });
}

// Neve decorativa.
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  for (let i = 0; i < 20; i++) {
    const floco = document.createElement("span");
    floco.className = "floco";
    floco.textContent = "❄";
    floco.setAttribute("aria-hidden", "true");
    floco.style.left = `${Math.random() * 100}vw`;
    floco.style.fontSize = `${10 + Math.random() * 14}px`;
    floco.style.animationDuration = `${9 + Math.random() * 9}s`;
    floco.style.animationDelay = `${-Math.random() * 15}s`;
    document.body.appendChild(floco);
  }
}

// Contagem regressiva para o próximo Natal.
function atualizarContagem() {
  const agora = new Date();
  let natal = new Date(agora.getFullYear(), 11, 25);
  if (agora >= natal) natal = new Date(agora.getFullYear() + 1, 11, 25);
  const restante = natal - agora;
  const texto = `${Math.floor(restante / 86400000)}d ${Math.floor(restante / 3600000) % 24}h ${Math.floor(restante / 60000) % 60}min ${Math.floor(restante / 1000) % 60}s para o Natal`;
  $$('[data-contagem]').forEach((el) => { el.textContent = texto; });
}
if ($('[data-contagem]')) { atualizarContagem(); window.setInterval(atualizarContagem, 1000); }

// Menu para telas pequenas.
$(".btn-menu")?.addEventListener("click", () => $(".menu")?.classList.toggle("aberto"));

// Voltar ao topo.
const botaoTopo = $("#topo");
if (botaoTopo) {
  const atualizarBotaoTopo = () => { botaoTopo.style.display = window.scrollY > 400 ? "block" : "none"; };
  window.addEventListener("scroll", atualizarBotaoTopo, { passive: true });
  atualizarBotaoTopo();
  botaoTopo.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

// Validação do formulário de contato.
const formulario = $("#form-contato");
if (formulario) {
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const valor = (id) => $(`#${id}`, formulario)?.value.trim() || "";
    const mensagem = $("#mensagem-form");
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor("email"));
    let erro = "";
    if (!valor("nome")) erro = "Por favor, digite seu nome.";
    else if (!emailValido) erro = "Digite um e-mail válido.";
    else if (!valor("assunto")) erro = "Conte-nos o assunto.";
    else if (valor("texto").length < 10) erro = "A mensagem precisa ter pelo menos 10 caracteres.";
    if (mensagem) {
      mensagem.className = erro ? "erro" : "";
      mensagem.textContent = erro || `Obrigado, ${valor("nome")}! Sua mensagem foi registrada nesta demonstração.`;
    }
    if (!erro) formulario.reset();
  });
}

configurarImagens();
atualizarCarrinho();
observarElementos();
