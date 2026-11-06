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
    <span>{{ byline.name }}</span>
    <span class="od-dim">·</span>
    <span>{{ byline.location }}</span>
    <span class="od-dim">·</span>
    <span>{{ new Date(`${byline.month}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) }}</span>
  </template>
</StoryCover>

<!--
The statewide winners and Democratic House majority follow data/02-power-board.ts.
These are unofficial election outcomes, with certification pending. Republicans
retain the Senate. The projected House membership and State Board of Education
majority still need a refresh before the talk.
-->
