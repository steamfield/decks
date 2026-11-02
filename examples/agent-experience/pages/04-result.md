<!--
SLIDE 4 · The result: 72 calls -> 8.
-->

<div class="od-slide">
  <span class="od-eyebrow emerald">What the agent taught us</span>
  <h2 class="od-h2">One task. 72 calls. Then 8.</h2>

  <div class="od-stats" style="margin-top:0.5rem;">
    <div class="od-stat">
      <div class="od-stat-num cyan-grad"><RollingNumber :value="72" /> <span class="unit">&rarr; 8</span></div>
      <div class="od-stat-label">API calls for the same research</div>
      <div class="od-stat-delta up">89% fewer, after 3 rounds of feedback</div>
    </div>
    <div class="od-stat">
      <div class="od-stat-num violet-grad"><RollingNumber :value="45" /><span class="unit">%</span></div>
      <div class="od-stat-label">fewer response tokens</div>
      <div class="od-stat-delta up">columnar format, keys written once</div>
    </div>
    <div class="od-stat">
      <div class="od-stat-num amber-grad"><RollingNumber :value="21" /> <span class="unit">&rarr; 0</span></div>
      <div class="od-stat-label">schema-inspection calls</div>
      <div class="od-stat-delta up">discover now describes itself</div>
    </div>
    <div class="od-stat">
      <div class="od-stat-num cyan-grad"><RollingNumber :value="7" /></div>
      <div class="od-stat-label">fixes shipped from the feedback</div>
      <div class="od-stat-delta flat">in one commit</div>
    </div>
  </div>

  <OdFooter />
</div>
