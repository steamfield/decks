<!--
SLIDE 1 · COVER: steamfield.io's hero, with the commit range behind the title
-->

<script setup>
import { BYLINE, RIDGE_WINDOW } from '../data/01-cover'

const month = new Date(`${BYLINE.month}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const since = new Date(`${RIDGE_WINDOW.start}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
</script>

<StoryCover>
  <template #field><NightDriveField /></template>
  <template #head>
    <div class="sf-cover-head od-enter-a">
      <span class="sf-wordmark"><SfMark class="sf-wordmark-mark" />steamfield</span>
      <span class="sf-cover-nav"><span>{{ BYLINE.event }}</span><span>{{ month }}</span></span>
    </div>
  </template>
  <template #title><span class="sf-chrome">Building for agents</span><span class="sf-script">in TypeScript</span></template>
  <template #lede><span class="sf-prompt">❯</span> Seven tools I built for working with coding agents.</template>
  <template #byline>
    <span class="sf-fig"><span class="sf-fig-no">Fig. 1</span> The mountains are commits per day across {{ RIDGE_WINDOW.repos }} product repositories since {{ since }}, as a seven-day average peaking at {{ RIDGE_WINDOW.peakPerDay }} a day. The sun is the Steamfield mark. Source: git history.</span>
    <span class="sf-cover-by"><span>{{ BYLINE.speaker }}</span><span class="is-alt">{{ BYLINE.studio }}</span></span>
  </template>
</StoryCover>

<!--
ABOUT THIS SLIDE
The picture is steamfield.io's hero. The mountain range is the seven-day average of commits per day across the product repositories, from May 4 to November 1, 2026.
Source: data-sources.md, Slide 1.

SAY
I'm Riley. I run Steamfield, a studio that builds its own products and takes no client work. Each product started as a tool I needed for my own work, and I still use all of them every day. Tonight I'll show seven of them. Most are written in TypeScript, and coding agents run some of them more often than I do, which changed how I build command line tools.

IF ASKED
What are the mountains? Commits per day across the product repos, averaged over seven days. The same figure is behind the title on steamfield.io.
-->
