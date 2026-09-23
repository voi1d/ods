(function () {
  "use strict";

  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. AJUSTE DA MANCHETE ---------- */
  var h1 = document.querySelector(".hero h1"),
    h1s = h1.querySelector(".clip>span");
  function fitTitle() {
    var box = h1.getBoundingClientRect().width;
    if (!box) return;
    h1.style.fontSize = "80px";
    var w = h1s.getBoundingClientRect().width;
    if (!w) return;
    h1.style.fontSize = (((100 * box) / w) * 0.995).toFixed(2) + "px";
  }
  fitTitle();
  if (document.fonts && document.fonts.ready)
    document.fonts.ready.then(fitTitle);
  addEventListener("resize", fitTitle);

  /* ---------- 2. ENTRADA ---------- */
  if (!reduce) {
    requestAnimationFrame(function () {
      var t = document.querySelector(".hero h1 .clip>span");
      t.style.transition = "transform 1s cubic-bezier(.22,1,.36,1)";
      t.style.transitionDelay = ".08s";
      t.style.transform = "translateY(0)";
    });
  }

  /* ---------- 3. NAV ---------- */
  var nav = document.getElementById("nav"),
    tk = false;
  addEventListener(
    "scroll",
    function () {
      if (tk) return;
      tk = true;
      requestAnimationFrame(function () {
        nav.classList.toggle("solid", scrollY > 40);
        tk = false;
      });
    },
    { passive: true },
  );

  /* ---------- 4. REVEAL + CONTADORES ---------- */
  var io = new IntersectionObserver(
    function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        var n =
          e.target.querySelector("[data-to]") ||
          (e.target.hasAttribute && e.target.hasAttribute("data-to")
            ? e.target
            : null);
        if (n && !n.dataset.done) {
          n.dataset.done = "1";
          count(n);
        }
        io.unobserve(e.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
  );
  function watch() {
    document.querySelectorAll(".rv:not(.in)").forEach(function (x) {
      io.observe(x);
    });
  }
  function count(e) {
    var to = parseFloat(e.dataset.to),
      suf = e.dataset.suf || "",
      t0 = null,
      dur = reduce ? 0 : 1000;
    if (!dur) {
      e.textContent = to + suf;
      return;
    }
    requestAnimationFrame(function s(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur),
        p = 1 - Math.pow(1 - k, 3);
      e.textContent = Math.round(to * p) + suf;
      if (k < 1) requestAnimationFrame(s);
      else e.textContent = to + suf;
    });
  }

  /* ---------- 5. CICLO ---------- */
  var CY = [
    [
      "Emissão",
      "Queimamos carvão, petróleo e gás, e desmatamos. A atmosfera recebe CO₂ mais rápido do que qualquer processo natural consegue reciclar.",
    ],
    [
      "O oceano absorve o calor",
      "Mais de 90% do calor extra do aquecimento global fica retido nas camadas superiores do mar. Sem esse amortecedor, o ar que respiramos estaria muito mais quente.",
    ],
    [
      "A água muda de composição",
      "O CO₂ dissolvido forma ácido carbônico. A água fica mais ácida e com menos oxigênio, dificultando a vida de corais, moluscos e do plâncton que sustenta a cadeia alimentar marinha.",
    ],
    [
      "O calor branqueia o recife",
      "Águas 1 a 2°C acima do normal por semanas fazem o coral expulsar a alga que o alimenta e o colore. Sem ela, ele perde a cor e, se o calor persiste, morre de fome.",
    ],
    [
      "O gelo derrete, o nível sobe",
      "Geleiras e calotas polares perdem massa, a água aquecida se expande, e o nível do mar sobe sobre cidades costeiras — fechando o ciclo com mais gente exposta e mais pressão por respostas urgentes.",
    ],
  ];
  var stepsEl = document.getElementById("steps");
  CY.forEach(function (c, i) {
    var d = document.createElement("div");
    d.className = "step";
    d.innerHTML =
      '<button type="button" aria-expanded="' +
      (i === 0) +
      '"><span class="num">0' +
      (i + 1) +
      "</span>" +
      '<span class="ttl">' +
      c[0] +
      '</span><span class="sign" aria-hidden="true"></span></button>' +
      '<div class="body"><p>' +
      c[1] +
      "</p></div>";
    stepsEl.appendChild(d);
  });
  stepsEl.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    var st = b.parentElement,
      open = st.classList.contains("open");
    stepsEl.querySelectorAll(".step").forEach(function (s) {
      s.classList.remove("open");
      s.querySelector(".body").style.height = "0px";
      s.querySelector("button").setAttribute("aria-expanded", "false");
    });
    if (!open) {
      st.classList.add("open");
      b.setAttribute("aria-expanded", "true");
      var bd = st.querySelector(".body");
      bd.style.height = bd.firstElementChild.offsetHeight + "px";
    }
  });
  (function () {
    var f = stepsEl.querySelector(".step");
    f.classList.add("open");
    f.querySelector(".body").style.height =
      f.querySelector("p").offsetHeight + "px";
  })();
  addEventListener("resize", function () {
    var o = stepsEl.querySelector(".step.open");
    if (o)
      o.querySelector(".body").style.height =
        o.querySelector("p").offsetHeight + "px";
  });

  /* ---------- 6. DADOS ---------- */
  var D = [
    [
      "90",
      "%",
      "do calor extra gerado pelo aquecimento global fica retido no oceano, não no ar que respiramos.",
      "IPCC",
      "s",
    ],
    [
      "20",
      " cm",
      "foi quanto o nível médio do mar já subiu desde 1900 — e o ritmo está acelerando.",
      "IPCC / NOAA",
      "s",
    ],
    [
      "50",
      "%",
      "dos recifes de coral rasos já foram perdidos, boa parte por branqueamento ligado ao aquecimento das águas.",
      "ONU / UICN",
      "s",
    ],
    [
      "30",
      "%",
      "é o quanto o oceano já acidificou desde a era pré-industrial, absorvendo o CO₂ que emitimos.",
      "IPCC",
      "c",
    ],
    [
      "8",
      "%",
      "do oceano está sob proteção efetiva. A meta acordada para 2030 é 30%.",
      "ONU / UICN",
      "s",
    ],
    [
      "1",
      " milhão",
      "de espécies terrestres e marinhas estão sob risco de extinção — o aquecimento acelera esse relógio.",
      "IPBES",
      "c",
    ],
    [
      "3,3",
      " bi",
      "de pessoas vivem em regiões altamente vulneráveis aos efeitos das mudanças climáticas, boa parte delas costeiras.",
      "IPCC",
      "c",
    ],
  ];
  var rowsEl = document.getElementById("rows");
  D.forEach(function (r) {
    var d = document.createElement("div");
    d.className = "row rv";
    d.innerHTML =
      '<b data-to="' +
      r[0] +
      '" data-suf="' +
      r[1] +
      '">0' +
      r[1] +
      "</b>" +
      '<div class="txt"><span class="dot ' +
      r[4] +
      '"></span>' +
      r[2] +
      "</div>" +
      '<div class="src">' +
      r[3] +
      "</div>";
    rowsEl.appendChild(d);
  });

  /* ---------- 7. AGIR ---------- */
  var A = [
    [
      "Reduza o carro no dia a dia",
      "Cada trajeto a pé, de bike ou de transporte público é menos CO₂ queimado — e menos calor indo parar no oceano.",
    ],
    [
      "Corte o desperdício de energia em casa",
      "Ar-condicionado, chuveiro elétrico e aparelhos em stand-by pesam mais do que parecem. Ajustar o termostato em 1-2°C já faz diferença.",
    ],
    [
      "Recuse o descartável de plástico de uso único",
      "Canudo, sacola, copo, talher. Boa parte desse plástico termina no mar.",
    ],
    [
      "Pergunte a espécie e a origem do peixe",
      "Na peixaria ou no restaurante. A pergunta em si já cria demanda por pesca rastreável e sustentável.",
    ],
    [
      "Tire a carne bovina de dois dias da semana",
      "Reduz metano, desmatamento e a pressão sobre a terra e o clima ao mesmo tempo.",
    ],
    [
      "Saia da praia ou da trilha com o seu lixo e mais um",
      "Um item que não é seu, toda vez. É o gesto mais barato desta página.",
    ],
    [
      "Calcule sua pegada de carbono uma vez este ano",
      "Descobrir onde ela é maior é o primeiro passo para reduzi-la de verdade.",
    ],
    [
      "Cobre quem decide",
      "Vote e pressione por metas de emissão mais ambiciosas, áreas marinhas protegidas e fim do desmatamento ilegal.",
    ],
  ];
  var todo = document.getElementById("todo");
  A.forEach(function (a) {
    var li = document.createElement("li");
    li.innerHTML =
      '<button type="button" aria-pressed="false"><span class="box" aria-hidden="true"></span>' +
      '<span class="t"><strong>' +
      a[0] +
      "</strong><small>" +
      a[1] +
      "</small></span></button>";
    todo.appendChild(li);
  });
  todo.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    var li = b.parentElement;
    li.classList.toggle("done");
    b.setAttribute("aria-pressed", li.classList.contains("done"));
    var n = todo.querySelectorAll("li.done").length;
    document.getElementById("cnum").textContent = n + " de 8";
    document.getElementById("cbar").style.width = (n / 8) * 100 + "%";
  });

  /* ---------- 8. ONGS ---------- */
  var ONGS = [
    {
      n: "Fundação Projeto Tamar",
      a: "🐢",
      s: "ODS 14 · Oceano",
      u: "https://www.tamar.org.br",
      d: "Protege as cinco espécies de tartarugas marinhas do Brasil desde 1980, monitorando praias de desova em toda a costa junto a comunidades pesqueiras.",
      t: ["Doação", "Visita apoia", "Estágio"],
    },
    {
      n: "Instituto Baleia Jubarte",
      a: "🐋",
      s: "ODS 14 · Oceano",
      u: "https://baleiajubarte.org.br",
      d: "Pesquisa e protege as jubartes que se reproduzem no litoral brasileiro — caso raro de espécie que saiu do risco crítico graças a décadas de conservação.",
      t: ["Doação", "Adoção simbólica"],
    },
    {
      n: "Projeto Coral Vivo",
      a: "🪸",
      s: "ODS 14 · Oceano",
      u: "https://www.coralvivo.org.br",
      d: "Estuda e protege os recifes brasileiros, que são únicos no mundo, e leva educação ambiental marinha para escolas e comunidades do litoral.",
      t: ["Doação", "Educação", "Voluntariado"],
    },
    {
      n: "Projeto Albatroz",
      a: "🐦",
      s: "ODS 14 · Oceano",
      u: "https://projetoalbatroz.org.br",
      d: "Reduz a captura acidental de albatrozes e petréis na pesca industrial, criando com os próprios pescadores técnicas que salvam aves sem reduzir a pesca.",
      t: ["Doação", "Parcerias"],
    },
    {
      n: "Projeto Golfinho Rotador",
      a: "🐬",
      s: "ODS 14 · Oceano",
      u: "https://www.golfinhorotador.org.br",
      d: "Monitora os golfinhos rotadores de Fernando de Noronha há mais de três décadas e cuida da educação ambiental de moradores e visitantes da ilha.",
      t: ["Doação", "Educação"],
    },
    {
      n: "Observatório do Clima",
      a: "📊",
      s: "ODS 13 · Clima",
      u: "https://www.oc.eco.br",
      d: "Rede de dezenas de organizações da sociedade civil brasileira que monitora políticas climáticas, produz o inventário de emissões do país e pressiona por metas mais ambiciosas.",
      t: ["Doação", "Voluntariado"],
    },
    {
      n: "Instituto Clima e Sociedade (iCS)",
      a: "🌱",
      s: "ODS 13 · Clima",
      u: "https://www.climaesociedade.org",
      d: "Organização filantrópica que financia projetos de desenvolvimento de baixo carbono e adaptação climática em comunidades vulneráveis pelo Brasil.",
      t: ["Doação", "Parcerias"],
    },
    {
      n: "Engajamundo",
      a: "🌍",
      s: "ODS 13 · Clima",
      u: "https://www.engajamundo.org",
      d: "Coletivo brasileiro liderado por jovens que forma novas lideranças climáticas e leva a juventude do país para dentro das negociações da ONU, como as COPs.",
      t: ["Voluntariado", "Formação"],
    },
    {
      n: "WWF-Brasil",
      a: "🌐",
      s: "ODS 13 + 14",
      u: "https://www.wwf.org.br",
      d: "Atua ao mesmo tempo em clima e oceanos: políticas públicas para reduzir emissões, áreas marinhas protegidas e pesca sustentável.",
      t: ["Doação mensal", "Campanhas"],
    },
    {
      n: "Greenpeace Brasil",
      a: "🚢",
      s: "ODS 13 + 14",
      u: "https://www.greenpeace.org/brasil/",
      d: "Investigação e pressão pública contra a expansão de combustíveis fósseis, poluição marinha e garimpo ilegal. Não aceita dinheiro de governos nem de empresas.",
      t: ["Doação mensal", "Ativismo"],
    },
  ];

  var track = document.getElementById("track");
  ONGS.forEach(function (o, i) {
    var c = document.createElement("article");
    c.className = "card";
    c.innerHTML =
      '<div class="card__art"><span class="emoji" aria-hidden="true">' +
      o.a +
      '</span><span class="card__idx">' +
      ("0" + (i + 1)).slice(-2) +
      "</span></div>" +
      '<div class="card__in"><span class="card__tag">' +
      o.s +
      "</span><h3>" +
      o.n +
      "</h3><p>" +
      o.d +
      "</p>" +
      "<ul>" +
      o.t
        .map(function (t) {
          return "<li>" + t + "</li>";
        })
        .join("") +
      "</ul>" +
      '<a href="' +
      o.u +
      '" target="_blank" rel="noopener noreferrer">Abrir o site oficial</a></div>';
    track.appendChild(c);
  });

  var prog = document.getElementById("prog"),
    cnt = document.getElementById("cnt"),
    pv = document.getElementById("prev"),
    nx = document.getElementById("next");
  function stepW() {
    var c = track.querySelector(".card");
    return c ? c.getBoundingClientRect().width + 18 : 300;
  }
  function upd() {
    var max = track.scrollWidth - track.clientWidth,
      p = max > 0 ? track.scrollLeft / max : 0;
    var vis = Math.max(
      0.12,
      Math.min(1, track.clientWidth / track.scrollWidth),
    );
    prog.style.width = vis * 100 + "%";
    prog.style.left = p * (100 - vis * 100) + "%";
    var i = Math.min(ONGS.length, Math.round(track.scrollLeft / stepW()) + 1);
    cnt.textContent = ("0" + i).slice(-2) + " / " + ONGS.length;
    pv.disabled = track.scrollLeft < 4;
    nx.disabled = track.scrollLeft > max - 4;
  }
  track.addEventListener(
    "scroll",
    function () {
      requestAnimationFrame(upd);
    },
    { passive: true },
  );
  addEventListener("resize", upd);
  pv.addEventListener("click", function () {
    track.scrollBy({
      left: -stepW(),
      behavior: reduce ? "auto" : "smooth",
    });
  });
  nx.addEventListener("click", function () {
    track.scrollBy({
      left: stepW(),
      behavior: reduce ? "auto" : "smooth",
    });
  });
  track.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      nx.click();
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      pv.click();
    }
  });
  setTimeout(upd, 60);

  watch();
})();
