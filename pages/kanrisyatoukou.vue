<template>
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-black text-[32px] mt-[30px] h-[50px] text-center border-b-4 font-['Noto Sans']">
        管理者投稿用
      </h1>
      <ul class="py-7">
        <li class="flex items-center mb-4 justify-between md:justify-center">
          <input id="radio-higuma" type="radio" value="higuma" name="post-type" class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
          <label for="radio-higuma" class="ms-2 text-base font-medium text-black dark:text-white">ヒグマ速報</label>
        </li>
        <li class="flex items-center mb-4 justify-between md:justify-center">
          <input id="radio-accident" type="radio" value="accident" name="post-type" class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
          <label for="radio-accident" class="ms-2 text-base font-medium text-black dark:text-white">事故速報</label>
        </li>
        <li class="flex items-center mb-4 justify-between md:justify-center">
          <input id="radio-snow" type="radio" value="snow" name="post-type" class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
          <label for="radio-snow" class="ms-2 text-base font-medium text-black dark:text-white">除雪速報</label>
        </li>
        <li class="flex items-center mb-4 justify-between md:justify-center">
          <input id="radio-suspicious" type="radio" value="suspicious" name="post-type" class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
          <label for="radio-suspicious" class="ms-2 text-base font-medium text-black dark:text-white">不審者速報</label>
        </li>
      </ul>
      <div class="w-full h-auto mb-10 bg-[#D9D9D9] flex flex-col items-center p-4 rounded-md">
        <label for="address" class="text-black text-[24px] font-['Noto Sans'] mb-2">・住所を入力</label>
        <input
          id="address"
          type="text"
          placeholder="例: 稚内市..."
          class="w-full max-w-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        />
      </div>
      <div class="w-full h-[300px] bg-[#D9D9D9]">
        <img :src="mapSrc" alt="Map" class="w-full h-full object-cover rounded-md shadow-md" />
      </div>
      <div class="flex justify-center py-8 text-black text-[14px] font-['Noto Sans']">
        ※注意事項を入力
      </div>
      <div class="flex justify-center">
        <button class="bg-[#D9D9D9] font-['Noto Sans'] text-black py-3 px-10 rounded hover:bg-gray-400 transition">
          登録
        </button>
      </div>
    </div>
  </template>

  <script setup lang="ts">
  definePageMeta({ layout: false });
  import { computed } from 'vue';

  const props = defineProps({
    latitude: Number,
    longitude: Number,
  });

  const zoom = 15; // ズームレベル

  const mapSrc = computed(() => {
    return `https://static-maps.yandex.ru/1.x/?ll=${props.longitude},${props.latitude}&z=${zoom}&size=600,300&l=map&pt=${props.longitude},${props.latitude},pm2rdm&lang=ja_JP`;
  });
  </script>
