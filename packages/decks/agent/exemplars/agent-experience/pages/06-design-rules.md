<!--
SLIDE 6 · What an agent's interface actually needs.
-->

<div class="od-slide">
  <span class="od-eyebrow amber">AX design rules</span>
  <h2 class="od-h2">What an agent's interface actually needs.</h2>

  <div class="ax-rules" style="margin-top:2rem;">
    <div class="ax-rule">
      <div class="ax-rule-k"><span class="ax-rule-n">01</span>Cut round-trips</div>
      <div class="ax-rule-v">Batch discover dedups server-side and returns join hints. Every call is latency, tokens, and context.</div>
    </div>
    <div class="ax-rule">
      <div class="ax-rule-k"><span class="ax-rule-n">02</span>The response is the docs</div>
      <div class="ax-rule-v">Discover ships value ranges, sample values, and distinct counts inline. Agents can't read docs, so they probe. Front-load it and the probing stops.</div>
    </div>
    <div class="ax-rule">
      <div class="ax-rule-k"><span class="ax-rule-n">03</span>Kill string hazards</div>
      <div class="ax-rule-v">Parameterized <span class="od-mono">?</span> and a params array. No SQL wrapped in JSON wrapped in shell.</div>
    </div>
    <div class="ax-rule is-next">
      <div class="ax-rule-k"><span class="ax-rule-n">04</span>Tokens over readability</div>
      <div class="ax-rule-v">Columnar is the default, so keys land once instead of per row. Roughly 45% fewer tokens on flat tabular data.</div>
    </div>
  </div>

  <OdFooter />
</div>
