<!--
SLIDE 9 · OpenChart: config is the agent's native tongue.
-->

<div class="od-slide">
  <span class="od-eyebrow violet">Config over code</span>
  <h2 class="od-h2">Agents write config better than code, so the chart is a config.</h2>

  <div class="od-twocol wide-right" style="margin-top:2rem;">
    <div style="display:flex; flex-direction:column; justify-content:center;">
      <p class="od-lede" style="margin:0; max-width:30vw;">Agents produce reliable config. They're worse at imperative drawing code.</p>
      <p class="od-body" style="margin:1.3rem 0 0; max-width:30vw;">So OpenChart takes a JSON spec and returns a chart. No components to scaffold, no renderer to import, no drawing calls.</p>
    </div>
    <div style="display:flex; flex-direction:column; justify-content:center;">
      <ToolCallCard server="opendata" tool="openchart" args="ChartSpec" time="1 call">
        <pre class="ax-spec"><span class="k">mark</span>:     bar
<span class="k">encoding</span>:
  <span class="k">x</span>:     year
  <span class="k">y</span>:     spending_per_capita
  <span class="k">color</span>: country
<span class="k">chrome</span>:
  <span class="k">title</span>: "Healthcare spend, 2000&ndash;2023"</pre>
      </ToolCallCard>
      <p class="od-caption" style="margin:1rem 0 0; text-align:center;">One spec in. One chart out.</p>
    </div>
  </div>

  <OdFooter />
</div>
