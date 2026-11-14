<script setup lang="ts">
/**
 * SfMark: the Steamfield mark, filled with the sunset gradient, as the site
 * draws it (one gradient across the whole mark, never per band).
 */
import { useId } from 'vue'
import { MARK_PATH, MARK_SIZE, SUNSET_STOPS } from '../data/brand'

const id = useId()
</script>

<template>
  <svg :viewBox="`0 0 ${MARK_SIZE} ${MARK_SIZE}`" aria-hidden="true">
    <defs>
      <linearGradient :id="id" x1="0" y1="0" x2="0" y2="1">
        <stop class="sf-sun-1" :offset="SUNSET_STOPS[0]" />
        <stop class="sf-sun-2" :offset="SUNSET_STOPS[1]" />
        <stop class="sf-sun-3" :offset="SUNSET_STOPS[2]" />
        <stop class="sf-sun-4" :offset="SUNSET_STOPS[3]" />
      </linearGradient>
    </defs>
    <path :d="MARK_PATH" :fill="`url(#${id})`" />
  </svg>
</template>
