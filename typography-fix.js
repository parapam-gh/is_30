(function () {
  'use strict';

  var RU_SHORT = [
    'или','изо','ото','обо','для','через','перед','меж','что','как','это','чем','тем','тот','моя','моё','мои','твоя','твоё','твои','наша','наше','наши','ваша','ваше','ваши','мне','тебе','ему','нам','вам','нас','вас','мой','твой','наш','ваш','его','её','их','она','оно','они','без','над','под','про','при','ещё',
    'и','а','но','да','же','бы','ли','не','ни','уж','в','во','на','к','ко','с','со','из','у','о','об','по','от','до','за','то','ты','вы','мы','он','ей','им','я','та','те'
  ];
  var EN_SHORT = [
    'the','and','are','was','were','you','your','our','him','her','them','from','with','this','that','into','been','have','has','is','as','it','if','be','we','my','i','a','an','of','in','on','at','to','or','he','she','do','by','for','but','no','so','up','us','am','me'
  ];

  var ALL_WORDS = [];
  RU_SHORT.forEach(function (w) { if (ALL_WORDS.indexOf(w) === -1) ALL_WORDS.push(w); });
  EN_SHORT.forEach(function (w) { if (ALL_WORDS.indexOf(w) === -1) ALL_WORDS.push(w); });

  // Leading boundary: start of string, whitespace (including nbsp), opening punctuation.
  // Trailing: literal ASCII space only — nbsp means already processed.
  // Lookahead: next char must be non-whitespace.
  var SHORT_WORD_RE = new RegExp(
    '(^|[\\s(\\[«“‘"\'])(' + ALL_WORDS.join('|') + ')( )(?=\\S)',
    'giu'
  );

  // Numbers (dates, quantities) stuck to the next short-ish word.
  // "11 июня", "2,5 часа", "9 JUN", "30 лет".
  var NUMBER_RE = /(\b\d{1,4}(?:[.,]\d+)?) (?=\S{1,12}(?:\s|$|[.,!?]))/g;

  // Em-dash / en-dash: nbsp before, regular space after (russian typographic rule).
  var DASH_RE = /(\s)([—–])\s/g;

  function typographText(s) {
    if (!s) return s;
    var out = s;
    // Two passes catch adjacent short words ("я и ты" — the space between "и" and "ты"
    // only becomes reachable by the regex after "я " is converted, because the new
    // " " is then matched by leading \s class).
    for (var i = 0; i < 2; i++) {
      out = out.replace(SHORT_WORD_RE, function (_m, pre, word) {
        return pre + word + ' ';
      });
    }
    out = out.replace(NUMBER_RE, '$1 ');
    out = out.replace(DASH_RE, ' $2 ');
    return out;
  }

  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, CODE: 1, PRE: 1, TEXTAREA: 1, NOSCRIPT: 1, KBD: 1, SAMP: 1 };

  function walk(node) {
    if (node.nodeType === 3) {
      var before = node.nodeValue;
      var after = typographText(before);
      if (after !== before) node.nodeValue = after;
      return;
    }
    if (node.nodeType === 1) {
      if (SKIP_TAGS[node.tagName]) return;
      var kids = node.childNodes;
      for (var i = 0; i < kids.length; i++) walk(kids[i]);
    }
  }

  var processing = false;
  var scheduled = false;

  function run() {
    scheduled = false;
    if (processing) return;
    processing = true;
    try { walk(document.body); } finally { processing = false; }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    // requestAnimationFrame coalesces multiple mutations from a single applyLang pass.
    (window.requestAnimationFrame || setTimeout)(run, 0);
  }

  function init() {
    run();
    var mo = new MutationObserver(function () {
      if (processing) return;
      schedule();
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
