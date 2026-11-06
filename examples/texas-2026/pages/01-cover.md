<!--
SLIDE 1 · COVER
-->

<script setup>
import { byline } from '../data/01-cover'
</script>

<StoryCover brand>
  <template #field><BallotField /></template>
  <template #title>Texas elected new leaders.<br/>What can they change<br/>for Austin's schools?</template>
  <template #byline>
    <span>{{ byline.location }}</span>
    <span class="od-dim">·</span>
    <span>{{ new Date(`${byline.month}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) }}</span>
  </template>
</StoryCover>

<!--
ABOUT THIS SLIDE
The opening question. The column on the right is a ballot: the four statewide offices and the Texas House fill in yellow, and the Senate stays empty. Yellow means an office changed hands, and that color keeps the same meaning for the rest of the talk.

SAY
On November 3, Texas voters elected Democrats to the four top statewide offices and, on unofficial returns, a majority in the Texas House. Republicans kept the Senate. At the same moment, Austin ISD is facing a possible state intervention over two middle schools. In the next twenty minutes: what changed, what the new leaders can and cannot do for Austin's schools, and which decisions come next. The results are unofficial until certification, and anything still pending is labeled on the slides.

IF ASKED
Is this a partisan talk? It reports who won and what each office can do under state law. Party names appear as text, and the tags on each slide separate confirmed facts from pending ones.
-->
