/* ============================================================
 *  合成大奶娃 · 破解版补丁：自选下一个生成什么
 *
 *  只改「下一颗发哪一级」，物理、合成判定、计分、复活全部沿用原版：
 *    · 面板里点一个水果 → 之后每次投放都是它（当前手里那颗也一起换掉）
 *    · 手机上侧边面板放不下，用面板里的 🎯 按钮开弹窗选；桌面端这个按钮是隐藏的
 *    · 「🎲 随机」恢复原版手感
 *    · 选择存在 localStorage，重开一局、关掉网页都还在
 *    · 默认不上传成绩（别拿破解分去挤公共排行榜），想上榜在面板里打开开关
 *    · 也可以在地址栏加 #pick=6 直接锁定第 6 级（1 起算，水果角上的小数字）
 *
 *  依赖 game.js 暴露的 window.__DNW__，所以要放在它后面加载。
 * ============================================================ */
(function () {
  'use strict';

  const TIER_KEY = 'danaiwa.mod.tier.v1';     // 存 'random' 或用级别索引
  const UP_KEY   = 'danaiwa.mod.upload.v1';   // '1' = 允许上传成绩

  function readStore(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function writeStore(key, v) {
    try { localStorage.setItem(key, v); } catch (e) { /* 无痕模式写不了，忽略 */ }
  }

  let api = null;        // game.js 的 __DNW__
  let forced = null;     // 锁定的级别索引；null = 原版随机
  let upload = readStore(UP_KEY) === '1';

  const isEl = (n) => !!n && n.nodeType === 1;

  /* ---------------------------------------------------------
   *  状态 → 界面
   * ------------------------------------------------------- */

  function nameOf(tier) {
    const f = api && api.FRUITS && api.FRUITS[tier];
    return f ? f.name : ('第 ' + (tier + 1) + ' 级');
  }

  /* tier 传 null = 恢复原版随机 */
  function apply(tier) {
    const max = (api && api.MAX_TIER) || 10;
    forced = (tier === null || tier === undefined || isNaN(tier))
      ? null
      : Math.max(0, Math.min(max, Math.round(tier)));

    writeStore(TIER_KEY, forced === null ? 'random' : String(forced));

    /* 本来就没锁、又选随机的时候不用去动游戏状态，免得白白重掷一次 */
    if (api && api.setForceTier && (forced !== null || (api.state && api.state.forceTier !== null))) {
      api.setForceTier(forced);
    }
    paint();
  }

  function paint() {
    document.querySelectorAll('[data-mod-fruit]').forEach((btn) => {
      const on = forced !== null && Number(btn.getAttribute('data-mod-fruit')) === forced;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', String(on));
    });

    const text = forced === null
      ? '当前：随机（原版手感）'
      : '当前：<b>' + nameOf(forced) + '</b> · 之后每次都投它';
    document.querySelectorAll('[data-mod-state]').forEach((el) => { el.innerHTML = text; });

    /* 面板里的「下一个」标题顺手标一下，一眼知道被接管了 */
    const nextLabel = document.querySelector('.next-box .box-label');
    if (nextLabel) {
      nextLabel.textContent = forced === null ? '下一个' : ('下一个 · 自选：' + nameOf(forced));
    }

    /* 两个入口按钮（桌面「下一个」那行的小按钮 / 手机信息条里的）一起更新 */
    document.querySelectorAll('[data-mod-open]').forEach((btn) => {
      const lbl = btn.querySelector('.lbl');
      if (lbl) lbl.textContent = forced === null ? '自选' : nameOf(forced);
      btn.classList.toggle('has-pick', forced !== null);
      btn.setAttribute('aria-pressed', String(forced !== null));
    });
  }

  /* ---------------------------------------------------------
   *  选择器：11 个按钮，面板里一份、手机弹窗里一份
   * ------------------------------------------------------- */

  function buildGrids() {
    const fruits = (api && api.FRUITS) || [];
    if (!fruits.length) return;

    document.querySelectorAll('[data-mod-grid]').forEach((grid) => {
      if (grid.getAttribute('data-built') === '1') return;
      grid.setAttribute('data-built', '1');

      fruits.forEach((f, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mod-fruit';
        btn.setAttribute('data-mod-fruit', String(i));
        btn.title = '第 ' + (i + 1) + ' 级 · ' + f.name;
        btn.setAttribute('aria-label', '自选' + f.name);

        const img = document.createElement('img');
        img.src = f.file;
        img.alt = f.name;
        img.decoding = 'async';

        const num = document.createElement('span');
        num.className = 'mod-num';
        num.setAttribute('aria-hidden', 'true');
        num.textContent = String(i + 1);

        btn.appendChild(img);
        btn.appendChild(num);
        grid.appendChild(btn);
      });
    });
  }

  function sheet() { return document.getElementById('modModal'); }

  function openSheet() {
    const m = sheet();
    if (!m) return;
    m.classList.add('show');
    m.setAttribute('aria-hidden', 'false');
  }

  function closeSheet() {
    const m = sheet();
    if (!m) return;
    m.classList.remove('show');
    m.setAttribute('aria-hidden', 'true');
  }

  function wire() {
    buildGrids();

    /* 面板和弹窗共用一套 data 属性，委托一次就够 */
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (!isEl(t)) return;

      const fruit = t.closest('[data-mod-fruit]');
      if (fruit) {
        apply(Number(fruit.getAttribute('data-mod-fruit')));
        closeSheet();
        return;
      }
      if (t.closest('[data-mod-random]')) { apply(null); return; }
      if (t.closest('[data-mod-open]')) { openSheet(); return; }
      if (t.closest('#modClose')) { closeSheet(); return; }
      if (t.id === 'modModal') { closeSheet(); return; }   /* 点遮罩关闭 */
    });

    /* 成绩上传：两处开关（面板 / 弹窗）保持同步 */
    const boxes = document.querySelectorAll('[data-mod-upload]');
    boxes.forEach((cb) => {
      cb.checked = upload;
      cb.addEventListener('change', () => {
        upload = cb.checked;
        writeStore(UP_KEY, upload ? '1' : '0');
        boxes.forEach((o) => { o.checked = upload; });
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSheet();
    });
  }

  /* ---------------------------------------------------------
   *  成绩上传：默认关掉，别把破解出来的分数写进公共排行榜
   * ------------------------------------------------------- */

  function gateUpload() {
    const board = window.DanaiwaBoard;
    if (!board || typeof board.onGameOver !== 'function' || board.__modGated) return;

    const orig = board.onGameOver;
    board.onGameOver = function (score) {
      if (upload) return orig.call(board, score);

      /* 不上传，但结算界面还是照原样给出分数，只把「正在结算…」换成说明 */
      const s = Number(score) || 0;
      const box = document.getElementById('submitBox');
      const msg = document.getElementById('submitMsg');
      const retry = document.getElementById('submitBtn');

      if (box) box.style.display = s > 0 ? '' : 'none';
      if (msg) {
        msg.textContent = s > 0 ? '破解版：本局成绩不上传（要上榜就打开「成绩上传」）' : '';
        msg.className = 'submit-msg';
      }
      if (retry) retry.hidden = true;
      return false;
    };
    board.__modGated = true;
  }

  /* ---------------------------------------------------------
   *  启动
   * ------------------------------------------------------- */

  function init() {
    api = window.__DNW__ || null;
    if (!api || !api.setForceTier) {
      if (window.console) console.warn('[mod] 没找到 __DNW__，自选功能没接上');
      return;
    }

    /* #pick=N（1 起算）优先于上次的选择，方便直接分享「锁定第几级」 */
    const hash = /pick=(\d+)/.exec(location.hash || '');
    const saved = readStore(TIER_KEY);
    let start = null;

    if (hash) {
      start = Math.max(0, Math.min(api.MAX_TIER, Number(hash[1]) - 1));
    } else if (saved !== null && saved !== 'random' && saved !== '') {
      const n = Number(saved);
      start = isNaN(n) ? null : Math.max(0, Math.min(api.MAX_TIER, n));
    }

    wire();
    apply(start);
    gateUpload();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
