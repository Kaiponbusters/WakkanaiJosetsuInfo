<template>
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- 画面幅を制限してサイズを保持 -->
      <h1 class="text-black text-[32px] mt-[30px] h-[50px] text-center border-b-4 font-['Noto Sans']">
        フィードバック
      </h1>
      <!-- トップ画面設定 -->
      <!--
      <h2 class="text-black text-[32px] px-10 py-5 text-center font-['Noto sans']">
        トップ画面設定
      </h2>
      <ul class="py-5">
        <li class="flex items-center mb-4 justify-center">
          <input
            id="default-radio-1"
            type="radio"
            value=""
            name="default-radio"
            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label
            for="default-radio-1"
            class="ms-2 text-sm font-medium text-text-black dark:text-text-black"
          >
            ヒグマ速報
          </label>
        </li>
        <li class="flex items-center mb-4 justify-center">
          <input
            id="default-radio-2"
            type="radio"
            value=""
            name="default-radio"
            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label
            for="default-radio-2"
            class="ms-2 text-sm font-medium text-black dark:text-text-black"
          >
            事故速報
          </label>
        </li>
        <li class="flex items-center mb-4 justify-center">
          <input
            id="default-radio-3"
            type="radio"
            value=""
            name="default-radio"
            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label
            for="default-radio-3"
            class="ms-2 text-sm font-medium text-text-black dark:text-text-black"
          >
            除雪速報
          </label>
        </li>
        <li class="flex items-center mb-4 justify-center">
          <input
            id="default-radio-4"
            type="radio"
            value=""
            name="default-radio"
            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label
            for="default-radio-4"
            class="ms-2 text-sm font-medium text-text-black dark:text-text-black"
          >
            不審者速報
          </label>
        </li>
      </ul>
      -->
      <!-- 投稿者登録 -->
      <!--
      <h2 class="text-black text-[32px] mt-[70px] h-[40px] text-center font-['Noto Sans']">
        投稿者はこちら
      </h2>
      <div class="flex justify-center py-5">
        <a
          href="kanrisyatoukou"
          class="bg-[#D9D9D9] font-['Noto Sans'] text-black py-3 px-10 rounded hover:bg-gray-400 transition"
        >
          登録
        </a>
      </div>
      <div class="flex justify-center">
        <button
          class="bg-[#D9D9D9] font-['Noto Sans'] text-black py-3 px-8 rounded hover:bg-gray-400 transition"
        >
          ログイン
        </button>
      </div>
      -->
      <!-- 不具合報告 -->
      <h2 class="text-black text-[32px] mt-[70px] h-[40px] text-center font-['Noto Sans']">
        不具合報告はこちら
      </h2>
      <div class="flex justify-center py-6">
        <a
          href="fuguaitoukou"
          class="bg-[#D9D9D9] font-['Noto Sans'] text-black py-3 px-10 rounded hover:bg-gray-400 transition"
        >
          投稿
        </a>
      </div>
    </div>
  </template>

  <script setup lang="ts">
  /**
   * @file  fuguaiPage.vue
   * @description 不具合報告ページの設定やレイアウトを定義しています。
   *
   * @remarks
   * このファイルでは `definePageMeta` を利用してページレイアウトを管理しています。
   */

  /** ページのメタ情報を定義します。 */
  definePageMeta({ layout: false });
  </script>
