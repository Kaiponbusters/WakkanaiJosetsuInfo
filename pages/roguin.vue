<template>
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- 画面幅を制限してサイズを保持 -->
      <h1 class="text-black text-[32px] mt-[30px] h-[50px] text-center border-b-4 font-['Noto Sans']">
        投稿者様専用ページ
      </h1>
      <h2 class="text-black text-[32px] mt-[70px] h-[40px] text-center font-['Noto Sans']">
        ログインはこちら
      </h2>
      <div class="flex justify-center py-5">
        <a
          href="roguinutikomi"
          class="bg-[#D9D9D9] font-['Noto Sans'] text-black py-3 px-10 rounded hover:bg-gray-400 transition"
        >
          ログイン画面
        </a>
      </div>
    </div>
  </template>

  <script setup lang="ts">
  definePageMeta({ layout: false });
  </script>
