<template>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- 画面幅を制限してサイズを保持 -->
      <h1 class="text-black text-[32px] mt-[30px] h-[50px] text-center border-b-4 font-['Noto Sans']">
        不具合報告
      </h1>
      <!-- お名前入力 -->
      <div class="grid gap-6 mb-6">
        <label
          for="name"
          class="block text-sm font-medium text-gray-900"
        >
          <span class="text-black text-[24px]">お名前</span>
        </label>
        <input
          type="text"
          id="name"
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          placeholder="お名前"
          required
        />
      </div>
      <!-- メールアドレス入力 -->
      <div class="grid gap-6 mb-6">
        <label
          for="email"
          class="block text-sm font-medium text-gray-900"
        >
          <span class="text-black text-[24px]">メールアドレス（任意）</span>
        </label>
        <input
          type="email"
          id="email"
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          placeholder="メールアドレス"
        />
      </div>
      <!-- フィードバック入力 -->
      <div class="grid gap-6 mb-6">
        <label
          for="feedback"
          class="block text-[24px] font-medium text-gray-900"
        >
          フィードバック
        </label>
        <textarea
          id="feedback"
          rows="6"
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          placeholder="フィードバック"
          required
        ></textarea>
      </div>
      <!-- 送信ボタン -->
      <div class="flex justify-center py-5">
        <button
          class="bg-[#D9D9D9] font-['Noto Sans'] text-black py-3 px-10 rounded hover:bg-gray-400 transition"
        >
          送信
        </button>
      </div>
      <div class="flex justify-center ">
        <a
          href="fuguaipage"
          class="bg-[#D9D9D9] font-['Noto Sans'] text-black py-3 px-10 rounded hover:bg-gray-400 transition"
        >
          戻る
        </a>
      </div>
    </div>
  </template>

  <script setup lang="ts">
  definePageMeta({ layout: false });
  </script>
