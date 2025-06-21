<template>
    <div>
      <SnowReportForm />
    </div>
  </template>

  <script setup lang="ts">
    import SnowReportForm from '~/components/feature/snow/SnowReportForm.vue'
    
    // 認証ミドルウェアを適用
    definePageMeta({ 
      layout: false,
      middleware: 'auth'
    })
  </script>