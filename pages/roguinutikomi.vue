<template>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- 画面幅を制限してサイズを保持 -->
      <h1 class="text-black text-[32px] mt-[30px] h-[50px] text-center border-b-4 font-['Noto Sans']">
        ログインページ
      </h1>
      <!-- id入力 -->
      <div class="grid gap-6 mb-6">
        <label
          for="id"
          class="block text-sm font-medium text-gray-900 dark:text-white"
        >
          <span class="text-black text-[24px]">id入力</span>
        </label>
        <input
          type="text"
          id="id"
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          required
        />
      </div>
      <!-- パスワード入力 -->
      <div class="grid gap-6 mb-6">
        <label
          for="pass"
          class="block text-sm font-medium text-gray-900 dark:text-white"
        >
          <span class="text-black text-[24px]">パスワード入力</span>
        </label>
        <input
          type="pass"
          id="pass"
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        />
      </div>
      <!-- 送信ボタン -->
      <div class="flex justify-center py-5">
        <button
          class="bg-[#D9D9D9] font-['Noto Sans'] text-black py-3 px-10 rounded hover:bg-gray-400 transition">
          ログイン
        </button>
      </div>
    </div>
  </template>

  <script setup lang="ts">
  definePageMeta({ layout: false });
  </script>
