<script setup lang="ts">
/**
 * The cover stage: the catalog graph, orbiting slowly behind the title.
 *
 * Same snapshot, same zoom as slide 4's graph beat, so the thing the deck
 * builds toward is the first thing on screen. Dimmed so the title reads over
 * it; the graph is backdrop here and subject on slide 4.
 *
 * Graph3D mounts only while this slide is the live one, so the cover and
 * slide 4 never hold two WebGL contexts at once.
 */
import { graphEdges, graphNodes } from '../data/graph-data'
import { COVER_DIM, GRAPH_ZOOM } from '../data/graph-view'
</script>

<template>
  <div class="od-cover-graph">
    <Graph3D :nodes="graphNodes" :edges="graphEdges" orbit :zoom="GRAPH_ZOOM" :dim="COVER_DIM" />
    <!-- Scrim under the type: the graph is brightest on the left, which is
         where the lede and the byline sit. Dimming the whole field would cost
         the graph its point, so the canvas is carried across the text column
         and released before the middle of the frame. -->
    <div class="od-cover-scrim"></div>
  </div>
</template>

<style scoped>
.od-cover-graph {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.od-cover-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--od-canvas) 0%, var(--od-canvas) 34%, transparent 58%);
}
</style>
