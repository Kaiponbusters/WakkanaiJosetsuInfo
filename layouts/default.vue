<template>
  <div>
    <SettingIcon />
    <PageHeader />
    <InformationIcon />
    <PageBody />
    <!-- 下記slotはNuxyLayoutコンポーネントの子要素に差し替わる -->
    <slot />
  </div>
</template>

<script setup lang="ts">
</script>

<style>
    html {
        font-family: "Helvetica Neue",
                    "Arial",
                    "Hiragino Kaku Gothic ProN",
                    "Hiragino Sans",
                    "Meiryo",
                    "sans-serif",
                    "Noto Sans JP",;
    }
</style>