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
On November 3, Texas voters elected Democrats to the four top statewide offices and, on unofficial returns, a majority in the Texas House. Republicans kept the Senate. Austin ISD is in the middle of a possible state intervention at the same moment. Over the next twenty minutes: what changed, what the new leaders can and cannot do about Austin's schools, and which decisions come next. Results are unofficial until certification; I'll flag what is still pending as we go.
-->
