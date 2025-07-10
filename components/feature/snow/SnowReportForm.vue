<template>
  <div class="max-w-4xl mx-auto px-4">
    <h1 class="text-black text-[32px] mt-[30px] h-[50px] text-center border-b-4 font-['Noto Sans']">
      除雪情報登録
    </h1>

    <form @submit.prevent="submitForm" class="mt-8">
      <div class="w-full h-auto mb-10 bg-[#D9D9D9] flex flex-col items-center p-4 rounded-md">
        <label for="area" class="text-black text-[24px] font-['Noto Sans'] mb-2">地域名</label>
        <input
          id="area"
          v-model="formData.area"
          type="text"
          placeholder="例: 稚内市..."
          class="w-full max-w-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
          :class="{ 'border-red-500': validationErrors.area }"
          aria-label="地域名"
          required
        />
        <p v-if="validationErrors.area" class="text-red-500 text-sm mt-1">
          {{ validationErrors.area }}
        </p>
      </div>

      <div class="mb-6">
        <label class="text-black text-[24px] font-['Noto Sans'] mb-2">除雪時間</label>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="start_time">除雪開始時間</label>
            <input
              id="start_time"
              v-model="formData.start_time"
              type="datetime-local"
              class="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5"
              :class="{ 'border-red-500': validationErrors.start_time }"
              aria-label="除雪開始時間"
              required
            />
            <p v-if="validationErrors.start_time" class="text-red-500 text-sm mt-1">
              {{ validationErrors.start_time }}
            </p>
          </div>
          <div>
            <label for="end_time">除雪終了時間</label>
            <input
              id="end_time"
              v-model="formData.end_time"
              type="datetime-local"
              class="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5"
              :class="{ 'border-red-500': validationErrors.end_time }"
              aria-label="除雪終了時間"
              required
            />
            <p v-if="validationErrors.end_time" class="text-red-500 text-sm mt-1">
              {{ validationErrors.end_time }}
            </p>
          </div>
        </div>
      </div>

      <div class="flex justify-center space-x-4">
        <button
          type="submit"
          :disabled="isSubmitting || !isFormValid"
          class="bg-gray-500 font-['Noto Sans'] text-black py-3 px-10 rounded transition"
          :class="{
            'hover:bg-gray-600': !isSubmitting && isFormValid,
            'opacity-50 cursor-not-allowed': isSubmitting || !isFormValid
          }"
        >
          {{ isSubmitting ? '登録中...' : '登録' }}
        </button>
        <button
          type="button"
          @click="navigateToList"
          :disabled="isSubmitting"
          class="bg-[#c0c0c0] text-white py-3 px-10 rounded transition"
          :class="{
            'hover:bg-gray-400': !isSubmitting,
            'opacity-50 cursor-not-allowed': isSubmitting
          }"
        >
          管理画面へ戻る
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useSnowReportForm } from '~/composables/useSnowReportForm'

// フォーム管理のcomposableを使用
const {
  formData,
  isSubmitting,
  validationErrors,
  isFormValid,
  submitForm,
  navigateToList
} = useSnowReportForm()
</script>