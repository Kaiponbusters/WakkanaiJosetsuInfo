<script setup lang="ts">
useHead({
  title: 'わっかない速報アプリ',
  meta: [
    {
      name: 'description',
      content: 'Wakkanai Realtime Information'
    }
  ],
  link: [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100&display=swap"
    }
  ]
})
</script>
<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>