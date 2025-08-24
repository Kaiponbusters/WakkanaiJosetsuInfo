<template>
    <div>
      <SnowReportForm />
    </div>
  </template>

  <script setup lang="ts">
    import SnowReportForm from '~/components/feature/snow/SnowReportForm.vue'
    // definePageMeta is auto-imported by Nuxt
    
    definePageMeta({ layout: false })
  </script>