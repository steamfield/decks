<!--
SLIDE 3 · The method: interview the agent like a user.
-->

<div class="od-slide">
  <span class="od-eyebrow">The method</span>
  <h2 class="od-h2">Interview the agent like you'd interview a user.</h2>

  <div class="od-twocol wide-left" style="margin-top:2rem;">
    <div>
      <ul class="od-bullets">
        <li>Point Claude at one real task: research US healthcare costs.</li>
        <li>Watch it work. Then ask it what hurt.</li>
        <li>It names the exact problem and usually suggests the fix.</li>
      </ul>
      <div class="od-quote" style="margin-top:1.7rem; max-width:38vw;">
        SQL quoting fails on ~10 to 15% of first tries from triple-nested escaping.
        <span class="od-quote-cite">Fix: parameterized queries with <span class="od-mono">?</span> placeholders and a <span class="od-mono">params</span> array.</span>
      </div>
    </div>
    <div style="display:flex; flex-direction:column; justify-content:center; gap:1rem;">
      <div class="od-loop-node">Run the task</div>
      <span class="od-loop-arrow">&darr;</span>
      <div class="od-loop-node">Post-mortem the agent</div>
      <span class="od-loop-arrow">&darr;</span>
      <div class="od-loop-node">Ship the fix</div>
      <span class="od-loop-arrow feedback">&#8629; repeat</span>
    </div>
  </div>

  <OdFooter />
</div>
