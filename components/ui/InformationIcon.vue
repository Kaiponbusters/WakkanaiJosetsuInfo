<template>
    <div class="flex">
        <!-- 画面情報表示部分 -->
        <div class="w-full flex mt-4 mb-7 ml-2 mr-2 items-center justify-center">
            <img
                :src="iconSrc"
                class="w-17 h-16 w-max-[67px] h-max-[67px] p-1 mr-3"
                :alt="iconAlt"
            />
            <h1
                :class="textColorClass"
                class="text-5xl font-bold font-['Noto Sans']"
            >
                {{ title }}
            </h1>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 画像をインポート
import josetsuIcon from '@/assets/img/josetsuImg/josetsuIcon.png'

// Props定義
const props = withDefaults(defineProps<{
    type?: 'josetsu' | 'default'
    title?: string
    iconSrc?: string
    iconAlt?: string
    textColor?: string
}>(), {
    type: 'default',
    title: 'デフォルト情報',
    iconAlt: 'アイコン',
    textColor: 'text-[#000000]'
})

// アイコン設定のマッピング
const iconConfig = {
    josetsu: {
        src: josetsuIcon,
        alt: '除雪アイコン',
        title: '除雪情報',
        color: 'text-[#578cff]'
    },
    default: {
        src: '',
        alt: 'デフォルトアイコン',
        title: 'デフォルト情報',
        color: 'text-[#000000]'
    }
}

// 実際に使用する値を計算
const iconSrc = computed(() => props.iconSrc || iconConfig[props.type]?.src || '')
const iconAlt = computed(() => props.iconAlt || iconConfig[props.type]?.alt || 'アイコン')
const title = computed(() => props.title || iconConfig[props.type]?.title || 'デフォルト情報')
const textColorClass = computed(() => props.textColor || iconConfig[props.type]?.color || 'text-[#000000]')
</script>