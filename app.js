(function () {
  var data = [
    { h: "チョーキング（白い粉）", p: "塗膜の表面が劣化して、顔料が粉になって出てくる状態です。防水の働きが弱まり始めているサインです。", r: "目安：塗り替えを考え始める時期です。" },
    { h: "外壁のひび", p: "髪の毛ほどの細いひびと、幅の広いひびでは対応が変わります。ひびから雨水が入ると、下地を傷めます。", r: "目安：早めの現地調査をおすすめします。" },
    { h: "色あせ・汚れ", p: "紫外線や雨で塗膜が傷むと、色が褪せて汚れも付きやすくなります。見た目の問題で済むうちに手を入れられます。", r: "目安：色を変える相談にも向いている時期です。" },
    { h: "屋根のサビ・苔", p: "金属屋根はサビ、スレート屋根は苔やひびが傷みの目印です。屋根は自分で見えにくいので、点検で状態を確認します。", r: "目安：サビが広がる前の点検が安心です。" },
    { h: "雨漏りの心配", p: "天井のシミや、壁紙の浮きがあれば、塗装だけで足りない場合があります。まず原因を調べます。", r: "目安：できるだけ早くご連絡ください。" }
  ];
  var btns = document.querySelectorAll("#sym-list button");
  var h = document.getElementById("sym-h"), p = document.getElementById("sym-p"), r = document.getElementById("sym-r");
  function show(i) {
    h.textContent = data[i].h; p.textContent = data[i].p; r.textContent = data[i].r;
    var panel = document.getElementById("sym-panel");
    panel.classList.remove("swap"); void panel.offsetWidth; panel.classList.add("swap");
    btns.forEach(function (b, k) { b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
  }
  btns.forEach(function (b) { b.addEventListener("click", function () { show(Number(b.dataset.i)); }); });
  show(0);

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var ba = document.getElementById("ba");
  var touched = false, raf = 0;
  function setP(v) {
    v = Math.max(0, Math.min(100, v));
    ba.style.setProperty("--p", v + "%");
    ba.setAttribute("aria-valuenow", String(Math.round(v)));
  }
  function fromEvent(e) {
    var r = ba.getBoundingClientRect();
    setP((e.clientX - r.left) / r.width * 100);
  }
  ba.addEventListener("pointerdown", function (e) {
    touched = true; cancelAnimationFrame(raf);
    try { ba.setPointerCapture(e.pointerId); } catch (x) {}
    fromEvent(e);
    ba.dataset.drag = "1";
  });
  ba.addEventListener("pointermove", function (e) { if (ba.dataset.drag === "1") fromEvent(e); });
  function endDrag() { ba.dataset.drag = "0"; }
  ba.addEventListener("pointerup", endDrag);
  ba.addEventListener("pointercancel", endDrag);
  ba.addEventListener("keydown", function (e) {
    var cur = Number(ba.getAttribute("aria-valuenow"));
    if (e.key === "ArrowLeft") { touched = true; setP(cur - 5); e.preventDefault(); }
    if (e.key === "ArrowRight") { touched = true; setP(cur + 5); e.preventDefault(); }
  });
  if (!reduce) {
    setP(0);
    var t0 = 0, dur = 2800, to = 62;
    setTimeout(function () {
      function step(ts) {
        if (touched) return;
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / dur);
        var e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        setP(to * e);
        if (k < 1) raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }, 500);
  }

  if (!reduce && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js");
    var targets = document.querySelectorAll("section h2, .cards article, .flow li, .work-grid figure, .price-wrap, dl.co, .sym-grid, .proc-grid, .sim-grid, .est-grid, .warn, details.faq, .owner .wrap > *, .contact-grid > *");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    targets.forEach(function (el) {
      var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.transitionDelay = (idx % 5) * 80 + "ms";
      el.classList.add("reveal");
      io.observe(el);
    });
  }

  var proc = [
    { h: "足場・養生", p: "作業の安全を確保し、塗料が飛び散らないよう、足場を組み、窓や植木、車などを養生シートで覆います。", w: "足場は、高所を丁寧に塗るための土台です。養生が甘いと、塗料が付着するトラブルにつながります。" },
    { h: "高圧洗浄", p: "高い水圧で、外壁に付いた汚れ、コケ、劣化した古い塗膜の粉を洗い流します。洗浄のあとは、壁を十分に乾かします。", w: "汚れや粉が残ったまま塗ると、塗料が壁に密着せず、はがれや膨れの原因になります。" },
    { h: "下地補修", p: "ひび割れを補修し、サビを落とし、外壁のすき間（シーリング）は、劣化の程度に応じて、打ち替えや増し打ちをします。", w: "傷んだ下地の上に塗っても、不具合がすぐに再発します。仕上がりの差が出やすい工程です。" },
    { h: "下塗り", p: "上塗りの塗料が壁にしっかり付くよう、専用の下塗り材を塗ります。壁が塗料を吸い込みすぎるのも防ぎます。", w: "下塗りは、いわば接着剤の役割です。下塗り材の選び方は、壁の素材や状態で変わります。" },
    { h: "中塗り", p: "上塗りと同じ塗料で、1回目の塗り重ねをします。塗膜の厚みをつくり、色むらを防ぎます。工程の間には、塗料ごとに決められた乾燥時間を置きます。", w: "塗料は、決められた量を、決められた回数に分けて塗ることで、本来の性能を発揮します。" },
    { h: "上塗り", p: "仕上げの塗り重ねです。紫外線や雨から外壁を守る、最後の層をつくります。", w: "中塗りと上塗りで同じ塗料を2回重ねるので、下塗りと合わせた3回塗りが基本です。" },
    { h: "完了確認", p: "塗り残し、色むら、付帯部（雨どい・軒天など）の仕上がりを確認します。足場を外す前に、お客様にも見ていただきます。", w: "足場がある間に確認すれば、手直しが必要な場合も、すぐに対応できます。" }
  ];
  var pBtns = document.querySelectorAll("#proc-list button");
  var pH = document.getElementById("proc-h"), pP = document.getElementById("proc-p"), pW = document.getElementById("proc-w");
  var L = {}; ["dirt", "crack", "patch", "under", "mid", "top", "prot", "protT", "ok"].forEach(function (k) { L[k] = document.getElementById("L-" + k); });
  function procShow(i) {
    pH.textContent = proc[i].h; pP.textContent = proc[i].p; pW.textContent = proc[i].w;
    pBtns.forEach(function (b, k) { b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
    L.dirt.classList.toggle("on", i < 1);
    L.crack.classList.toggle("on", i < 2);
    L.patch.classList.toggle("on", i >= 2);
    L.under.classList.toggle("on", i >= 3);
    L.mid.classList.toggle("on", i >= 4);
    L.top.classList.toggle("on", i >= 5);
    L.prot.classList.toggle("on", i >= 5);
    L.protT.classList.toggle("on", i >= 5);
    L.ok.classList.toggle("on", i >= 6);
  }
  pBtns.forEach(function (b) { b.addEventListener("click", function () { procShow(Number(b.dataset.i)); }); });
  procShow(0);

  var sim = document.getElementById("sim");
  document.querySelectorAll(".chips").forEach(function (g) {
    g.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      g.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      sim.style.setProperty("--" + g.dataset.var, b.dataset.c);
      document.getElementById("n-" + g.dataset.var).textContent = b.dataset.n;
    });
  });

  document.getElementById("form").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("f-name").value.trim();
    var tel = document.getElementById("f-tel").value.trim();
    var msg = document.getElementById("form-msg");
    if (!name || !tel) { msg.textContent = "お名前とお電話番号を入力してください。"; return; }
    msg.textContent = "確認用のたたき台のため、まだ送信されません。公開時に送信先を設定します。";
  });
})();
