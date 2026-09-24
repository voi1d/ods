/* ==========================================================================
   quiz.js — Diagnóstico de pegada de carbono e impacto oceânico
   --------------------------------------------------------------------------
   Todos os fatores abaixo são valores médios publicados na literatura
   científica e em bases de dados oficiais. Onde há incerteza relevante,
   isso é declarado no painel de metodologia (#qz-sources-body).
   Fontes centrais: ver objeto SOURCES no final deste arquivo.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     1. FATORES DE EMISSÃO (a "verdade" por trás de cada número)
     --------------------------------------------------------------------- */
  var EF = {
    // kg CO2e por km rodado, por combustível/veículo — DEFRA/BEIS 2023
    // (carro médio a gasolina = 0.166 kgCO2e/km; etanol hidratado é bem
    // mais baixo em base fóssil por ser majoritariamente biogênico, mas
    // não é zero por causa do cultivo, insumos e transporte da cana).
    carFuel: {
      gasolina: 0.166,
      flex: 0.15,
      etanol: 0.06,
      diesel: 0.171,
      moto: 0.10,
      eletrico: 0.01, // já usando a matriz elétrica limpa do Brasil
      nao_uso: 0
    },
    bus: 0.10, // kgCO2e/passageiro-km, ônibus urbano médio (DEFRA/BEIS)
    // Voos: valores por viagem de ida e volta, já incluindo o efeito de
    // forçamento radiativo (contrails/altitude), base DEFRA/BEIS 2023-24.
    flightShortRoundTrip: 300, // doméstico/curto, ~1000-1500 km ida e volta
    flightLongRoundTrip: 1800, // internacional/longo, ~9000-12000 km ida e volta
    // Fator de emissão do Sistema Interligado Nacional (SIN) — MCTI/SIRENE.
    // Em 2023 a média anual foi 38,5 kg/MWh; em 2024-25 variou entre 21,5 e
    // 59,9 kg/MWh conforme o mês (hidrologia e despacho térmico). Usamos
    // 50 g/kWh (0,05 kg/kWh) como estimativa central do período recente.
    gridBR: 0.05, // kg CO2e / kWh
    tarifaMediaRS: 0.85, // R$/kWh, tarifa residencial média aproximada — usada só para converter conta de luz em kWh
    // Dieta: kg CO2e/dia por padrão alimentar — Scarborough et al.,
    // "Dietary greenhouse gas emissions of meat-eaters, fish-eaters,
    // vegetarians and vegans in the UK", Climatic Change (2014), Oxford.
    diet: {
      alto: 7.19,       // carne >=100g/dia
      medio: 5.63,      // carne 50-99g/dia
      baixo: 4.67,      // carne <50g/dia
      pescetariano: 3.91,
      vegetariano: 3.81,
      vegano: 2.89
    },
    wasteMult: { nunca: 1.0, raramente: 1.05, semanal: 1.15, quase_diario: 1.30 },
    beefExtra: { nunca: 0, moderado: 150, frequente: 400, diario: 700 }, // kg/ano, ajuste por carne bovina especificamente (Poore & Nemecek: boi ~3-6x o carbono do frango)
    fashion: { fastfashion: 550, moderado: 250, duravel: 80 }, // kg CO2e/ano
    eletronicos: { frequente: 350, moderado: 150, conserto: 50 }, // kg CO2e/ano
    ecommerce: { expresso: 180, padrao: 80, consolidado: 30 }, // kg CO2e/ano
    residuos: { nenhuma: 100, parcial: 0, completa: -50 } // kg CO2e/ano (metano evitado por compostagem/segregação)
  };

  // Benchmarks de comparação (toneladas de CO2e/pessoa/ano)
  var BENCH = {
    brasil: 6.5, // pegada de carbono de consumo per capita — Circularity Gap Report Brazil, 2023
    global: 6.0, // média global de consumo per capita — mesma referência / Our World in Data
    meta1p5: 2.3 // faixa citada em estudos de "pegadas de 1,5°C" (ex.: Hot or Cool Institute) para 2030
  };

  var SOURCES_HTML = "" +
    "<p>Este relatório soma estimativas por categoria usando fatores de emissão publicados, sem contagem duplicada entre categorias (por exemplo, o consumo de chuveiro elétrico e ar-condicionado já está embutido na conta de luz informada, então essas perguntas são usadas só para o diagnóstico qualitativo, não somadas de novo).</p>" +
    "<ul>" +
    "<li><strong>Transporte:</strong> fatores de emissão por km — <code>UK DEFRA/BEIS, Greenhouse Gas Conversion Factors 2023-2024</code>.</li>" +
    "<li><strong>Voos:</strong> DEFRA/BEIS, categorias curto/longo curso com forçamento radiativo incluído.</li>" +
    "<li><strong>Eletricidade:</strong> fator de emissão do Sistema Interligado Nacional — <code>MCTI/SIRENE</code> (Sistema de Registro Nacional de Emissões), 2023-2025.</li>" +
    "<li><strong>Dieta:</strong> <code>Scarborough et al., Climatic Change (2014)</code>, Universidade de Oxford — e <code>Poore &amp; Nemecek, Science (2018)</code> para o efeito específico da carne bovina.</li>" +
    "<li><strong>Desperdício de alimentos:</strong> <code>FAO</code> e <code>UNEP Food Waste Index (2021)</code> — desperdício responde por cerca de 8 a 10% das emissões globais de GEE.</li>" +
    "<li><strong>Indústria têxtil:</strong> <code>UNFCCC</code>, <code>Ellen MacArthur Foundation</code> — moda responde por cerca de 8-10% das emissões globais; peças fast fashion podem gerar até 400% mais emissões por uso do que peças duráveis.</li>" +
    "<li><strong>Plástico no oceano:</strong> <code>Jambeck et al., Science (2015)</code> — entre 4,8 e 12,7 milhões de toneladas de plástico (estimativa central de 8 milhões) entram no oceano por ano.</li>" +
    "<li><strong>Pesca:</strong> <code>FAO, State of World Fisheries and Aquaculture (SOFIA)</code> — 35,4% dos estoques pesqueiros globais estão sobre-explotados (2022), variação semelhante confirmada no levantamento de 2025.</li>" +
    "<li><strong>Calor no oceano:</strong> <code>IPCC</code> — mais de 90% do calor extra retido pelo aquecimento global fica armazenado no oceano.</li>" +
    "<li><strong>Comparações per capita:</strong> <code>Circularity Gap Report Brazil (2023)</code> e <code>Our World in Data</code>.</li>" +
    "</ul>" +
    "<p>Limitações honestas: estes são fatores médios, não uma medição do seu consumo real. Diferenças regionais (ex.: apagões que aumentam o despacho termelétrico) e de eficiência de veículos/eletrodomésticos específicos não são capturadas. O objetivo é ordem de grandeza correta e comparável, não uma auditoria de carbono certificada.</p>";

  /* ---------------------------------------------------------------------
     2. BANCO DE PERGUNTAS — MODO RÁPIDO
     --------------------------------------------------------------------- */
  var QUICK = [
    {
      key: "transporte", section: "Transporte", type: "single",
      text: "No seu dia a dia, como você se desloca?",
      options: [
        { label: "De carro, sozinho(a), quase sempre — mesmo em trajetos curtos.", co2: 1730 },
        { label: "Varia: às vezes carro, às vezes transporte público.", co2: 900 },
        { label: "Predominantemente ônibus, metrô ou trem.", co2: 250 },
        { label: "Predominantemente a pé ou de bicicleta.", co2: 50 }
      ]
    },
    {
      key: "voos", section: "Transporte", type: "single",
      text: "Quantos voos você fez no último ano?",
      options: [
        { label: "Nenhum.", co2: 0 },
        { label: "1 voo doméstico/curto.", co2: 300 },
        { label: "1 voo internacional/longo, ou 2 curtos.", co2: 1000 },
        { label: "Vários voos, incluindo ao menos um longo.", co2: 3000 }
      ]
    },
    {
      key: "dieta", section: "Alimentação", type: "single",
      text: "Como você descreveria seu padrão alimentar?",
      options: [
        { label: "Carne em praticamente todas as refeições (≥100g/dia).", co2: 2624 },
        { label: "Carne diariamente, em quantidade moderada (50-99g/dia).", co2: 2055 },
        { label: "Pouca carne, ou principalmente peixe.", co2: 1566 },
        { label: "Vegetariano(a) ou vegano(a).", co2: 1204 }
      ]
    },
    {
      key: "desperdicio", section: "Alimentação", type: "single",
      text: "Com que frequência comida estraga ou é jogada fora na sua casa?",
      options: [
        { label: "Raramente — o planejamento é eficiente.", co2: 0 },
        { label: "Às vezes, algumas sobras por semana.", co2: 150 },
        { label: "Com frequência — descarto quase todo dia.", co2: 350 }
      ]
    },
    {
      key: "energia", section: "Energia", type: "single",
      text: "Como é o consumo de energia elétrica na sua casa?",
      options: [
        { label: "Baixo — divido casa com mais pessoas, uso moderado.", co2: 200 },
        { label: "Médio — uso comum de eletrodomésticos e climatização.", co2: 600 },
        { label: "Alto — ar-condicionado/aquecedor quase sempre ligado.", co2: 1200 }
      ]
    },
    {
      key: "roupas", section: "Consumo", type: "single",
      text: "Como você renova o guarda-roupa?",
      options: [
        { label: "Compro roupas novas com frequência, sigo tendências (fast fashion).", co2: 550 },
        { label: "Compro moderadamente, misturando lojas e ocasiões.", co2: 250 },
        { label: "Priorizo durabilidade, conserto ou brechó.", co2: 80 }
      ]
    },
    {
      key: "eletronicos", section: "Consumo", type: "single",
      text: "Quando você troca celular, notebook ou outros eletrônicos?",
      options: [
        { label: "Com frequência, para acompanhar lançamentos.", co2: 350 },
        { label: "Quando o desempenho cai bastante.", co2: 150 },
        { label: "Só quando quebra de vez, e tento consertar antes.", co2: 50 }
      ]
    },
    {
      key: "residuos", section: "Consumo", type: "single",
      text: "Como você lida com o lixo em casa?",
      options: [
        { label: "Não separo nada.", co2: 100 },
        { label: "Separo recicláveis dos orgânicos, às vezes.", co2: 0 },
        { label: "Separação completa, com compostagem do orgânico.", co2: -50 }
      ]
    },
    {
      key: "plastico", section: "Oceano", type: "single",
      text: "Como você lida com plástico de uso único (sacola, copo, canudo)?",
      options: [
        { label: "Aceito por padrão, não penso muito nisso.", ocean: 0 },
        { label: "Às vezes recuso, quando é fácil.", ocean: 50 },
        { label: "Recuso sistematicamente, ando com alternativas.", ocean: 100 }
      ]
    },
    {
      key: "oleo", section: "Oceano", type: "single",
      text: "Como você descarta óleo de cozinha usado?",
      options: [
        { label: "Pela pia/ralo.", ocean: 0 },
        { label: "No lixo comum.", ocean: 30 },
        { label: "Guardo para coleta especializada ou reaproveito.", ocean: 100 }
      ]
    },
    {
      key: "frutosdomar", section: "Oceano", type: "single",
      text: "Você sabe a origem do peixe/frutos do mar que consome?",
      options: [
        { label: "Não penso nisso, mesmo sabendo que algumas espécies são ameaçadas.", ocean: 0 },
        { label: "Não sei a origem na maioria das vezes.", ocean: 40 },
        { label: "Busco espécies com certificação de pesca sustentável.", ocean: 100 }
      ]
    },
    {
      key: "participacao", section: "Oceano", type: "single",
      text: "Você participa de ações concretas de proteção ambiental (mutirões, doações, cobrança política)?",
      options: [
        { label: "Nunca pensei nisso.", ocean: 20 },
        { label: "Já participei alguma vez.", ocean: 60 },
        { label: "Sim, de forma recorrente.", ocean: 100 }
      ]
    }
  ];

  /* ---------------------------------------------------------------------
     3. BANCO DE PERGUNTAS — MODO COMPLETO (27 perguntas, 5 seções)
     --------------------------------------------------------------------- */
  var FULL = [
    // ---- Transporte ----
    { key: "t_carkm", section: "Transporte 1/5", type: "number", unit: "km/semana",
      text: "Quantos km por semana você roda de carro ou moto (como motorista ou passageiro habitual) em trajetos do dia a dia?",
      help: "Some trajetos de casa-trabalho, mercado, etc. Se não usa carro/moto, digite 0.", placeholder: "ex: 120", min: 0, max: 3000 },
    { key: "t_carfuel", section: "Transporte 1/5", type: "single",
      text: "Qual combustível ou tipo de veículo predomina nesses trajetos?",
      options: [
        { label: "Gasolina", value: "gasolina" }, { label: "Flex, abastecendo majoritariamente gasolina", value: "flex" },
        { label: "Etanol", value: "etanol" }, { label: "Diesel", value: "diesel" },
        { label: "Motocicleta", value: "moto" }, { label: "Elétrico/híbrido plug-in", value: "eletrico" },
        { label: "Não uso carro nem moto", value: "nao_uso" }
      ] },
    { key: "t_buskm", section: "Transporte 2/5", type: "number", unit: "km/semana",
      text: "Quantos km por semana você percorre de ônibus, metrô ou trem?",
      help: "Estimativa é suficiente.", placeholder: "ex: 60", min: 0, max: 2000 },
    { key: "t_voos_curtos", section: "Transporte 3/5", type: "number", unit: "voos/ano",
      text: "Quantos voos domésticos ou curtos (até ~3h) você fez no último ano?", placeholder: "ex: 1", min: 0, max: 50 },
    { key: "t_voos_longos", section: "Transporte 4/5", type: "number", unit: "voos/ano",
      text: "Quantos voos internacionais ou longos (mais de ~6h) você fez no último ano?", placeholder: "ex: 0", min: 0, max: 30 },
    // ---- Energia ----
    { key: "e_moradores", section: "Energia 1/5", type: "number", unit: "pessoas",
      text: "Quantas pessoas moram na sua casa, dividindo a mesma conta de luz?", placeholder: "ex: 3", min: 1, max: 20 },
    { key: "e_contaluz", section: "Energia 2/5", type: "number", unit: "R$/mês",
      text: "Qual o valor médio da conta de luz mensal da sua casa?",
      help: "Usamos uma tarifa média residencial (~R$0,85/kWh) só para converter o valor em consumo estimado de energia.", placeholder: "ex: 220", min: 0, max: 10000 },
    { key: "e_aquecimento", section: "Energia 3/5", type: "single",
      text: "Como é aquecida a água do seu banho?",
      help: "Isso já está refletido na sua conta de luz — usamos essa resposta só para o diagnóstico, sem somar de novo.",
      options: [ { label: "Chuveiro elétrico", value: "eletrico" }, { label: "Aquecimento a gás", value: "gas" }, { label: "Energia solar", value: "solar" } ] },
    { key: "e_clima", section: "Energia 4/5", type: "single",
      text: "Quantas horas por dia, em média, você usa ar-condicionado ou aquecedor?",
      options: [ { label: "Nenhuma ou raramente", value: "0" }, { label: "1 a 3 horas", value: "1-3" }, { label: "4 a 8 horas", value: "4-8" }, { label: "Mais de 8 horas / quase o dia todo", value: "8+" } ] },
    { key: "e_eletro", section: "Energia 5/5", type: "single",
      text: "Como são os principais eletrodomésticos da sua casa (geladeira, ar-condicionado, máquina de lavar)?",
      options: [ { label: "Modernos, com selo Procel/eficiência A", value: "eficiente" }, { label: "Mistura de antigos e novos", value: "misto" }, { label: "Majoritariamente antigos (mais de 10-15 anos)", value: "antigo" } ] },
    // ---- Alimentação ----
    { key: "a_dieta", section: "Alimentação 1/5", type: "single",
      text: "Qual frase melhor descreve seu padrão alimentar predominante?",
      options: [
        { label: "Carne em praticamente todas as refeições (≥100g/dia)", value: "alto" },
        { label: "Carne diariamente, quantidade moderada (50-99g/dia)", value: "medio" },
        { label: "Carne ocasional, pouca quantidade (<50g/dia)", value: "baixo" },
        { label: "Como peixe, mas evito carne vermelha/branca", value: "pescetariano" },
        { label: "Vegetariano(a) — sem carne nem peixe", value: "vegetariano" },
        { label: "Vegano(a) — sem nenhum produto animal", value: "vegano" }
      ] },
    { key: "a_bovina", section: "Alimentação 2/5", type: "single",
      text: "Quantas vezes por semana você come carne bovina especificamente?",
      help: "A carne bovina tem uma pegada de carbono de 3 a 6 vezes maior que frango, por causa do metano entérico e do uso da terra (Poore & Nemecek, Science, 2018).",
      options: [ { label: "Nunca ou quase nunca", value: "nunca" }, { label: "1 a 2 vezes", value: "moderado" }, { label: "3 a 5 vezes", value: "frequente" }, { label: "Praticamente todo dia", value: "diario" } ] },
    { key: "a_desperdicio", section: "Alimentação 3/5", type: "single",
      text: "Com que frequência comida estraga ou sobra é descartada na sua casa?",
      options: [ { label: "Quase nunca", value: "nunca" }, { label: "Raramente", value: "raramente" }, { label: "Semanalmente", value: "semanal" }, { label: "Quase todo dia", value: "quase_diario" } ] },
    { key: "a_origem_peixe", section: "Alimentação 4/5", type: "single",
      text: "Quando compra peixe/frutos do mar, você verifica a origem ou certificação?",
      options: [ { label: "Não, mesmo sabendo que há espécies ameaçadas", ocean: 0 }, { label: "Não costumo saber a origem", ocean: 40 }, { label: "Sim, procuro selos de pesca sustentável", ocean: 100 } ] },
    { key: "a_freq_peixe", section: "Alimentação 5/5", type: "single",
      text: "Com que frequência você consome peixe ou frutos do mar de origem desconhecida ou não certificada?",
      help: "35,4% dos estoques pesqueiros globais estão sobre-explotados (FAO, SOFIA 2022/2025). Consumo frequente sem procedência aumenta essa pressão.",
      options: [ { label: "Raramente ou nunca", ocean: 100 }, { label: "1 a 2 vezes por semana", ocean: 55 }, { label: "3 ou mais vezes por semana", ocean: 20 } ] },
    // ---- Consumo e resíduos ----
    { key: "c_roupas", section: "Consumo 1/5", type: "single",
      text: "Como você renova o guarda-roupa?",
      help: "A indústria da moda responde por cerca de 8-10% das emissões globais de GEE (UNFCCC/Ellen MacArthur Foundation); peças fast fashion são usadas em média menos de 5 vezes.",
      options: [ { label: "Compro com frequência, sigo tendências (fast fashion)", value: "fastfashion" }, { label: "Compro moderadamente, marcas variadas", value: "moderado" }, { label: "Priorizo durabilidade, conserto ou brechó", value: "duravel" } ] },
    { key: "c_eletronicos", section: "Consumo 2/5", type: "single",
      text: "Com que frequência você troca celular, notebook ou outros eletrônicos pessoais?",
      options: [ { label: "Frequentemente, por lançamento/estética", value: "frequente" }, { label: "Quando o desempenho cai", value: "moderado" }, { label: "Só quando quebra, e tento consertar antes", value: "conserto" } ] },
    { key: "c_ecommerce", section: "Consumo 3/5", type: "single",
      text: "Qual seu padrão de compras online?",
      options: [ { label: "Frete expresso, itens separados", value: "expresso" }, { label: "Frete padrão, sem agrupar pedidos", value: "padrao" }, { label: "Agrupo itens e priorizo comércio local", value: "consolidado" } ] },
    { key: "c_residuos", section: "Consumo 4/5", type: "single",
      text: "Como funciona a separação de lixo na sua casa?",
      options: [ { label: "Não separo nada", value: "nenhuma" }, { label: "Separação parcial (recicláveis dos orgânicos)", value: "parcial" }, { label: "Separação completa, com compostagem do orgânico", value: "completa" } ] },
    { key: "c_limpeza", section: "Consumo 5/5", type: "single",
      text: "Que tipo de produto de limpeza doméstica você usa com mais frequência?",
      options: [ { label: "Industrializados convencionais (agressivos)", ocean: 0 }, { label: "Uma mistura de convencionais e naturais", ocean: 50 }, { label: "Prioritariamente naturais/biodegradáveis", ocean: 100 } ] },
    // ---- Oceano ----
    { key: "o_oleo", section: "Oceano 1/7", type: "single",
      text: "Como você descarta óleo de cozinha usado?",
      options: [ { label: "Pela pia ou ralo", ocean: 0 }, { label: "No lixo comum", ocean: 30 }, { label: "Guardo para coleta especializada ou reaproveito", ocean: 100 } ] },
    { key: "o_plastico", section: "Oceano 2/7", type: "single",
      text: "Como você lida com plásticos de uso único (sacola, copo, talher, canudo)?",
      help: "Estima-se que entre 4,8 e 12,7 milhões de toneladas de plástico entrem no oceano por ano (Jambeck et al., Science, 2015).",
      options: [ { label: "Aceito por padrão", ocean: 0 }, { label: "Às vezes recuso", ocean: 50 }, { label: "Recuso sistematicamente, ando com alternativas", ocean: 100 } ] },
    { key: "o_cosmeticos", section: "Oceano 3/7", type: "single",
      text: "Você verifica se seus produtos de higiene/cosméticos contêm microesferas plásticas (microplásticos)?",
      options: [ { label: "Nunca verifiquei", ocean: 20 }, { label: "Às vezes", ocean: 60 }, { label: "Sim, evito ativamente", ocean: 100 } ] },
    { key: "o_pesca", section: "Oceano 4/7", type: "single",
      text: "Ao comprar peixe/frutos do mar, você pergunta a espécie e o método de captura?",
      options: [ { label: "Nunca pergunto", ocean: 10 }, { label: "Às vezes", ocean: 55 }, { label: "Sempre, e escolho opções certificadas", ocean: 100 } ] },
    { key: "o_mutirao", section: "Oceano 5/7", type: "single",
      text: "Você já participou de limpezas de praia/rio ou apoia (com tempo ou doação) organizações de conservação marinha?",
      options: [ { label: "Nunca", ocean: 20 }, { label: "Já participei uma vez", ocean: 60 }, { label: "Sim, de forma recorrente", ocean: 100 } ] },
    { key: "o_protetor", section: "Oceano 6/7", type: "single",
      text: "Que tipo de protetor solar você usa quando vai ao mar ou rio?",
      help: "Oxibenzona e octinoxato — comuns em filtros químicos — têm sido associados a estresse em corais em estudos de toxicidade; por isso já foram banidos em áreas como o Havaí.",
      options: [ { label: "Filtro químico comum, sempre", ocean: 20 }, { label: "Às vezes mineral (físico)", ocean: 55 }, { label: "Sempre mineral / formulado como 'reef-safe'", ocean: 100 } ] },
    { key: "o_agua", section: "Oceano 7/7", type: "single",
      text: "Como você gerencia o fluxo de água no banho e na escovação dos dentes?",
      options: [ { label: "Fluxo contínuo, sem me preocupar", ocean: 20 }, { label: "Interrupção irregular", ocean: 55 }, { label: "Interrupção sistemática, banhos curtos", ocean: 100 } ] }
  ];

  /* ---------------------------------------------------------------------
     4. ESTADO E NAVEGAÇÃO
     --------------------------------------------------------------------- */
  var state = { mode: null, bank: [], index: 0, answers: {} };

  var introEl = document.getElementById("qz-intro");
  var quizEl = document.getElementById("qz-quiz");
  var resultsEl = document.getElementById("qz-results");

  document.querySelectorAll(".qz-mode-card").forEach(function (card) {
    card.addEventListener("click", function () {
      startQuiz(card.getAttribute("data-mode"));
    });
  });

  function startQuiz(mode) {
    state.mode = mode;
    state.bank = mode === "rapido" ? QUICK : FULL;
    state.index = 0;
    state.answers = {};
    introEl.classList.add("qz-hidden");
    resultsEl.classList.add("qz-hidden");
    quizEl.classList.remove("qz-hidden");
    renderQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  var backBtn = document.getElementById("qz-back");
  var nextBtn = document.getElementById("qz-next");
  backBtn.addEventListener("click", function () {
    if (state.index === 0) {
      quizEl.classList.add("qz-hidden");
      introEl.classList.remove("qz-hidden");
      return;
    }
    state.index--;
    renderQuestion();
  });
  nextBtn.addEventListener("click", function () {
    if (state.index >= state.bank.length - 1) {
      finishQuiz();
    } else {
      state.index++;
      renderQuestion();
    }
  });

  function renderQuestion() {
    var q = state.bank[state.index];
    document.getElementById("qz-section-label").textContent = q.section;
    document.getElementById("qz-counter").textContent = "Pergunta " + (state.index + 1) + " / " + state.bank.length;
    document.getElementById("qz-question-text").textContent = q.text;
    document.getElementById("qz-question-help").textContent = q.help || "";
    document.getElementById("qz-progress-fill").style.width = (state.index / state.bank.length) * 100 + "%";
    nextBtn.textContent = (state.index >= state.bank.length - 1) ? "Ver relatório →" : "Próxima →";

    var box = document.getElementById("qz-options");
    box.innerHTML = "";
    backBtn.disabled = false;

    if (q.type === "number") {
      var wrap = document.createElement("div");
      wrap.className = "qz-numfield";
      var input = document.createElement("input");
      input.type = "number"; input.min = q.min || 0; input.max = q.max || 99999;
      input.placeholder = q.placeholder || "0";
      input.value = state.answers[q.key] !== undefined ? state.answers[q.key] : "";
      input.addEventListener("input", function () {
        var v = parseFloat(input.value);
        if (isNaN(v) || v < 0) { nextBtn.disabled = true; delete state.answers[q.key]; return; }
        state.answers[q.key] = v;
        nextBtn.disabled = false;
      });
      wrap.appendChild(input);
      var unit = document.createElement("span"); unit.className = "unit"; unit.textContent = q.unit || "";
      wrap.appendChild(unit);
      box.appendChild(wrap);
      nextBtn.disabled = state.answers[q.key] === undefined;
      setTimeout(function () { input.focus(); }, 50);
    } else {
      nextBtn.disabled = state.answers[q.key] === undefined;
      q.options.forEach(function (opt) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "qz-opt";
        if (state.answers[q.key] === opt) b.classList.add("selected");
        b.innerHTML = opt.label;
        b.addEventListener("click", function () {
          state.answers[q.key] = opt;
          box.querySelectorAll(".qz-opt").forEach(function (x) { x.classList.remove("selected"); });
          b.classList.add("selected");
          nextBtn.disabled = false;
        });
        box.appendChild(b);
      });
    }
  }

  /* ---------------------------------------------------------------------
     5. CÁLCULO
     --------------------------------------------------------------------- */
  function num(key) { return state.answers[key] === undefined ? 0 : state.answers[key]; }
  function opt(key) { return state.answers[key]; }
  function val(key) { var o = state.answers[key]; return o ? o.value : undefined; }

  function calculate() {
    var breakdown = {}; // categoria -> kg CO2e/ano
    var oceanScores = [];
    var actions = []; // {title, desc, kgSaved}

    if (state.mode === "rapido") {
      QUICK.forEach(function (q) {
        var a = state.answers[q.key];
        if (!a) return;
        if (a.co2 !== undefined) {
          breakdown[q.section] = (breakdown[q.section] || 0) + a.co2;
        }
        if (a.ocean !== undefined) oceanScores.push(a.ocean);
      });
      // ações: para cada pergunta de carbono, comparar com a melhor opção
      QUICK.forEach(function (q) {
        if (q.options[0].co2 === undefined) return;
        var a = state.answers[q.key];
        if (!a) return;
        var best = q.options.reduce(function (m, o) { return o.co2 < m.co2 ? o : m; }, q.options[0]);
        var save = a.co2 - best.co2;
        if (save > 20) {
          actions.push({ title: actionTitle(q.key), desc: actionDesc(q.key), kgSaved: save });
        }
      });
    } else {
      // ---- Transporte ----
      var carFactor = EF.carFuel[val("t_carfuel")] !== undefined ? EF.carFuel[val("t_carfuel")] : EF.carFuel.flex;
      var carCo2 = num("t_carkm") * 52 * carFactor;
      var busCo2 = num("t_buskm") * 52 * EF.bus;
      var flightsCo2 = num("t_voos_curtos") * EF.flightShortRoundTrip + num("t_voos_longos") * EF.flightLongRoundTrip;
      breakdown["Transporte"] = carCo2 + busCo2 + flightsCo2;

      if (val("t_carfuel") && val("t_carfuel") !== "etanol" && val("t_carfuel") !== "eletrico" && val("t_carfuel") !== "nao_uso" && num("t_carkm") > 0) {
        var saveEtanol = num("t_carkm") * 52 * (carFactor - EF.carFuel.etanol);
        if (saveEtanol > 20) actions.push({ title: "Trocar gasolina por etanol nos seus trajetos de carro", desc: "Etanol tem pegada de carbono bem menor por ser majoritariamente biogênico. Baseado nos " + Math.round(num("t_carkm")) + " km/semana que você informou.", kgSaved: saveEtanol });
      }
      if (num("t_carkm") > 50) {
        var switchKm = Math.min(num("t_carkm"), num("t_carkm") * 0.5);
        var saveBus = switchKm * 52 * (carFactor - EF.bus);
        if (saveBus > 20) actions.push({ title: "Substituir metade dos km de carro por transporte público", desc: "Trocar cerca de " + Math.round(switchKm) + " km/semana de carro por ônibus/metrô.", kgSaved: saveBus });
      }
      if (num("t_voos_longos") > 0) actions.push({ title: "Evitar um voo internacional/longo por ano", desc: "Cada voo longo de ida e volta emite cerca de 1.800 kg de CO₂e — mais do que a pegada anual de transporte de muitas pessoas.", kgSaved: EF.flightLongRoundTrip });

      // ---- Energia ----
      var kwhMes = (num("e_contaluz") / EF.tarifaMediaRS);
      var kwhPessoaMes = kwhMes / Math.max(1, num("e_moradores"));
      var electricityCo2 = kwhPessoaMes * 12 * EF.gridBR;
      breakdown["Energia"] = electricityCo2;

      // ---- Alimentação ----
      var dietKgDay = EF.diet[val("a_dieta")] !== undefined ? EF.diet[val("a_dieta")] : EF.diet.medio;
      var wasteMult = EF.wasteMult[val("a_desperdicio")] || 1.0;
      var dietCo2 = dietKgDay * 365 * wasteMult;
      var beefExtra = EF.beefExtra[val("a_bovina")] || 0;
      breakdown["Alimentação"] = dietCo2 + beefExtra;
      if (val("a_dieta") && val("a_dieta") !== "vegano" && val("a_dieta") !== "vegetariano") {
        var saveVeg = (dietKgDay - EF.diet.vegetariano) * 365 * wasteMult;
        if (saveVeg > 20) actions.push({ title: "Reduzir carne para um padrão vegetariano na maior parte das refeições", desc: "Baseado no seu padrão atual (" + dietKgDay.toFixed(1) + " kgCO₂e/dia, Scarborough et al. 2014), migrar para o padrão vegetariano (3,81 kgCO₂e/dia) economiza isto por ano.", kgSaved: saveVeg });
      }
      if (beefExtra > 0) actions.push({ title: "Substituir carne bovina por frango, ovos ou leguminosas em parte das refeições", desc: "A carne bovina tem pegada de 3 a 6 vezes maior que o frango (Poore & Nemecek, 2018).", kgSaved: beefExtra });
      if (val("a_desperdicio") === "quase_diario" || val("a_desperdicio") === "semanal") {
        var saveWaste = dietKgDay * 365 * (wasteMult - 1.0);
        if (saveWaste > 20) actions.push({ title: "Planejar compras para reduzir desperdício de alimentos", desc: "Desperdício de comida responde por 8-10% das emissões globais de GEE (FAO/UNEP).", kgSaved: saveWaste });
      }

      // ---- Consumo ----
      var roupasCo2 = EF.fashion[val("c_roupas")] || 0;
      var eletroCo2 = EF.eletronicos[val("c_eletronicos")] || 0;
      var ecomCo2 = EF.ecommerce[val("c_ecommerce")] || 0;
      var residCo2 = EF.residuos[val("c_residuos")] || 0;
      breakdown["Consumo e resíduos"] = roupasCo2 + eletroCo2 + ecomCo2 + residCo2;

      if (val("c_roupas") === "fastfashion") actions.push({ title: "Priorizar peças duráveis ou de segunda mão", desc: "Peças fast fashion são usadas em média menos de 5 vezes e podem gerar até 400% mais emissões por uso do que peças duráveis.", kgSaved: EF.fashion.fastfashion - EF.fashion.duravel });
      if (val("c_eletronicos") === "frequente") actions.push({ title: "Prolongar a vida útil de celulares e notebooks", desc: "Trocar por obsolescência estética, e não por necessidade real, multiplica o impacto do ciclo de fabricação.", kgSaved: EF.eletronicos.frequente - EF.eletronicos.conserto });
      if (val("c_residuos") === "nenhuma") actions.push({ title: "Separar recicláveis de orgânicos e começar a compostar", desc: "Resíduo orgânico em aterro gera metano, um gás com potencial de aquecimento 28 a 84 vezes maior que o CO₂ em horizontes de tempo distintos.", kgSaved: EF.residuos.nenhuma - EF.residuos.completa });

      // ---- Oceano ----
      ["a_origem_peixe", "a_freq_peixe", "c_limpeza", "o_oleo", "o_plastico", "o_cosmeticos", "o_pesca", "o_mutirao", "o_protetor", "o_agua"].forEach(function (k) {
        var a = state.answers[k];
        if (a && a.ocean !== undefined) oceanScores.push(a.ocean);
      });
    }

    var totalKg = 0;
    Object.keys(breakdown).forEach(function (k) { totalKg += breakdown[k]; });
    var oceanScore = oceanScores.length ? Math.round(oceanScores.reduce(function (a, b) { return a + b; }, 0) / oceanScores.length) : 50;

    actions.sort(function (a, b) { return b.kgSaved - a.kgSaved; });

    return { breakdown: breakdown, totalKg: totalKg, oceanScore: oceanScore, actions: actions.slice(0, 6) };
  }

  function actionTitle(key) {
    var map = {
      transporte: "Reduzir dependência do carro sozinho em trajetos curtos",
      voos: "Reduzir a quantidade de voos, sobretudo os longos",
      dieta: "Reduzir consumo de carne, priorizando padrão vegetariano",
      desperdicio: "Planejar compras para reduzir desperdício de alimentos",
      energia: "Reduzir uso de ar-condicionado/aquecedor e eletrodomésticos ociosos",
      roupas: "Priorizar peças duráveis ou de segunda mão",
      eletronicos: "Prolongar a vida útil de eletrônicos",
      residuos: "Separar resíduos e compostar o orgânico"
    };
    return map[key] || key;
  }
  function actionDesc(key) {
    var map = {
      transporte: "Trajetos curtos de carro têm o pior custo-benefício de emissão por km percorrido.",
      voos: "Um único voo longo pode superar a pegada anual de transporte terrestre de uma pessoa inteira.",
      dieta: "Baseado em Scarborough et al. (2014): dieta com muita carne emite quase o dobro de uma dieta vegana.",
      desperdicio: "Alimento desperdiçado carrega toda a emissão da produção, sem gerar nenhum benefício.",
      energia: "No Brasil a eletricidade é relativamente limpa, mas o consumo elevado ainda pesa, especialmente em períodos de estiagem com mais térmicas ligadas.",
      roupas: "A indústria têxtil responde por 8-10% das emissões globais de GEE.",
      eletronicos: "A maior parte do impacto de um eletrônico está na fabricação, não no uso.",
      residuos: "Resíduo orgânico em aterro sanitário gera metano, um gás de efeito estufa potente."
    };
    return map[key] || "";
  }

  /* ---------------------------------------------------------------------
     6. RELATÓRIO FINAL
     --------------------------------------------------------------------- */
  function finishQuiz() {
    var r = calculate();
    quizEl.classList.add("qz-hidden");
    resultsEl.classList.remove("qz-hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });

    var tCO2 = r.totalKg / 1000;
    document.getElementById("qz-headline").textContent = tCO2.toFixed(1) + " tCO₂e / ano";
    document.getElementById("qz-headline-sub").innerHTML = headlineSub(tCO2);

    renderCompare(tCO2);
    renderBreakdown(r.breakdown, r.totalKg);
    renderOcean(r.oceanScore);
    renderCritique(tCO2, r.breakdown, r.oceanScore);
    renderActions(r.actions);
    document.getElementById("qz-sources-body").innerHTML = SOURCES_HTML;
  }

  function headlineSub(tCO2) {
    if (tCO2 >= BENCH.brasil * 1.4) return "Isso é bem acima da média brasileira (" + BENCH.brasil + " t) e da média global (" + BENCH.global + " t) de pegada de carbono por pessoa.";
    if (tCO2 >= BENCH.brasil * 0.85) return "Isso está próximo da média brasileira de pegada de carbono por pessoa (" + BENCH.brasil + " t/ano).";
    if (tCO2 >= BENCH.meta1p5) return "Isso está abaixo da média brasileira, mas ainda acima da faixa citada em estudos de compatibilidade com 1,5°C para 2030 (" + BENCH.meta1p5 + " t).";
    return "Isso está dentro ou perto da faixa citada em estudos de compatibilidade com metas climáticas de 1,5°C para 2030.";
  }

  function renderCompare(tCO2) {
    var max = Math.max(tCO2, BENCH.brasil, BENCH.global, BENCH.meta1p5) * 1.15;
    var rows = [
      { label: "Você", val: tCO2, cls: "you" },
      { label: "Média Brasil", val: BENCH.brasil, cls: "" },
      { label: "Média global", val: BENCH.global, cls: "" },
      { label: "Meta 1,5°C (2030)", val: BENCH.meta1p5, cls: "target" }
    ];
    var box = document.getElementById("qz-compare");
    box.innerHTML = "";
    rows.forEach(function (row) {
      var el = document.createElement("div");
      el.className = "qz-compare-row";
      el.innerHTML =
        '<span class="qz-compare-label">' + row.label + "</span>" +
        '<span class="qz-compare-track"><span class="qz-compare-fill ' + row.cls + '" style="width:' + Math.max(2, (row.val / max) * 100) + '%"></span></span>' +
        '<span class="qz-compare-val">' + row.val.toFixed(1) + " t</span>";
      box.appendChild(el);
    });
  }

  function renderBreakdown(breakdown, totalKg) {
    var box = document.getElementById("qz-breakdown");
    box.innerHTML = "";
    var entries = Object.keys(breakdown).map(function (k) { return { name: k, kg: breakdown[k] }; });
    entries.sort(function (a, b) { return b.kg - a.kg; });
    var max = Math.max.apply(null, entries.map(function (e) { return Math.abs(e.kg); }).concat([1]));
    entries.forEach(function (e) {
      var row = document.createElement("div");
      row.className = "qz-bd-row";
      var pct = Math.max(2, (Math.abs(e.kg) / max) * 100);
      row.innerHTML =
        '<span>' + e.name + "</span>" +
        '<span class="qz-bd-track"><span class="qz-bd-fill" style="width:' + pct + '%"></span></span>' +
        '<span class="qz-bd-val">' + (e.kg / 1000).toFixed(2) + " t</span>";
      box.appendChild(row);
    });
  }

  function renderOcean(score) {
    document.getElementById("qz-ocean-fill").style.left = score + "%";
    var text;
    if (score < 35) text = "Seu padrão de consumo tem contato direto e frequente com os principais vetores de poluição marinha mapeados pela ciência: descarte de óleo, plástico de uso único e falta de rastreabilidade na pesca. Globalmente, entre 4,8 e 12,7 milhões de toneladas de plástico entram no oceano todo ano (Jambeck et al., Science, 2015), e 35,4% dos estoques pesqueiros do planeta já estão sobre-explotados (FAO, SOFIA). Suas escolhas atuais reforçam essa pressão, não a reduzem.";
    else if (score < 65) text = "Você já adota algumas práticas de proteção, mas de forma inconsistente. É o perfil mais comum: reconhece o problema, mas a mudança de hábito ainda depende de conveniência. Pequenos ajustes recorrentes — descarte correto de óleo, recusa sistemática de plástico de uso único, escolha de pesca certificada — têm efeito cumulativo real diante dos 8 milhões de toneladas de plástico que entram no oceano por ano.";
    else text = "Seu padrão de consumo evita ativamente os principais vetores individuais de poluição marinha. Isso não resolve sozinho a sobre-exploração pesqueira (35,4% dos estoques globais, FAO) nem o aquecimento oceânico — mais de 90% do calor extra do aquecimento global fica retido no oceano, segundo o IPCC —, mas reduz sua contribuição pessoal a esses processos de forma mensurável.";
    document.getElementById("qz-ocean-text").textContent = text;
  }

  function renderCritique(tCO2, breakdown, oceanScore) {
    var top = Object.keys(breakdown).reduce(function (m, k) { return breakdown[k] > (breakdown[m] || -Infinity) ? k : m; }, null);
    var html = "";
    if (tCO2 >= BENCH.brasil * 1.4) {
      html += "<p><strong>Seu maior vetor de emissão é " + (top || "seu padrão de consumo") + "</strong>, e o total calculado — " + tCO2.toFixed(1) + " toneladas de CO₂e por ano — está bem acima tanto da média brasileira de consumo per capita (" + BENCH.brasil + " t, Circularity Gap Report Brazil, 2023) quanto da média global (" + BENCH.global + " t).</p>";
      html += "<p>Isso não é um julgamento moral, é aritmética: cada escolha que você marcou tem um fator de emissão publicado por trás. A distância entre o seu número e a faixa de " + BENCH.meta1p5 + " toneladas citada em estudos de compatibilidade com 1,5°C para 2030 não se fecha com gestos simbólicos — fecha reduzindo, de fato, o item de maior peso na sua decomposição acima.</p>";
    } else if (tCO2 >= BENCH.brasil * 0.85) {
      html += "<p>Com " + tCO2.toFixed(1) + " toneladas de CO₂e por ano, você está próximo da média de um brasileiro (" + BENCH.brasil + " t, base de consumo). Isso significa que seu perfil reproduz o padrão médio do país — nem excepcionalmente predatório, nem alinhado com o que a ciência do clima considera compatível com 1,5°C.</p>";
      html += "<p>Sua maior categoria de emissão é <strong>" + (top || "-") + "</strong>. É ali que uma mudança de hábito produz o maior efeito absoluto, não nas categorias menores.</p>";
    } else {
      html += "<p>Com " + tCO2.toFixed(1) + " toneladas de CO₂e por ano, seu resultado está abaixo da média brasileira e da média global de pegada de carbono por pessoa. Isso é factualmente positivo, mas vale uma ressalva honesta: em termos absolutos, atingir o zero líquido planetário não depende de indivíduos isolados atingirem números baixos, depende de mudança estrutural na matriz energética e produtiva global.</p>";
      html += "<p>Ainda assim, sua categoria de maior peso é <strong>" + (top || "-") + "</strong> — é o único ponto no seu perfil com alguma folga real para melhorar.</p>";
    }
    if (oceanScore < 40) {
      html += "<p>Em paralelo, seu índice de impacto oceânico está entre os mais baixos possíveis nesta escala. Diferente do carbono, o dano de plástico e químicos no oceano é local e imediato — não depende de política internacional para começar a diminuir a partir da sua próxima decisão de compra.</p>";
    }
    document.getElementById("qz-critique").innerHTML = html;
  }

  function renderActions(actions) {
    var list = document.getElementById("qz-actions");
    list.innerHTML = "";
    if (!actions.length) {
      list.innerHTML = "<li><div class='qz-action-top'><span class='qz-action-title'>Seu perfil já está próximo da faixa mais eficiente calculável com estas perguntas.</span></div><p class='qz-action-desc'>Isso não significa impacto zero — significa que, dentro do escopo individual medido aqui, o maior espaço de melhora agora depende de mudanças estruturais (matriz energética, políticas públicas), não apenas de hábito pessoal.</p></li>";
      return;
    }
    actions.forEach(function (a) {
      var li = document.createElement("li");
      li.innerHTML =
        '<div class="qz-action-top"><span class="qz-action-title">' + a.title + '</span><span class="qz-action-save">-' + Math.round(a.kgSaved) + " kg/ano</span></div>" +
        '<p class="qz-action-desc">' + a.desc + "</p>";
      list.appendChild(li);
    });
  }

  document.getElementById("qz-restart").addEventListener("click", function () {
    resultsEl.classList.add("qz-hidden");
    introEl.classList.remove("qz-hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

})();
