<script setup lang="ts">
// useHead is auto-imported by Nuxt

useHead({
  title: 'わっかない除雪速報アプリ(制作中)',
  meta: [
    {
      name: 'description',
      content: 'Wakkanai Josetsu Information'
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