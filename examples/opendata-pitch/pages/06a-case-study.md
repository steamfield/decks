<!--
SLIDE 6a · DIVIDER: the case study opens
-->

<script setup lang="ts">
// One home for the link, shared with the slide it opens (DistrictBarsStage), so
// the divider and the slide cannot point at different articles.
import { ARTICLE_URL } from '../data/tea-districts'
</script>

<StoryCover center>
  <template #eyebrow><OdEyebrow accent="amber">Case study · A state education agency</OdEyebrow></template>
  <template #title>Two tests, ten districts,<br/>one contradiction.</template>
  <template #lede>Why do high-poverty Rio Grande Valley ISDs outperform Austin's economically disadvantaged students?</template>
  <template #aside><StoryLink :href="ARTICLE_URL" /></template>
</StoryCover>
