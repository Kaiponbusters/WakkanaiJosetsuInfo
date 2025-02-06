<template>
    <div :class="['w-full h-[41px] flex justify-center items-center relative cursor-pointer', bgColor]" @click="navigate">
        <h2 :class="['text-2xl font-bold', 'font-NotoSans', textColor]">
            {{ text }}
        </h2>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const props = defineProps({
    text: {
        type: String,
        required: true
    },
    textColor: {
        type: String,
        required: true
    },
    bgColor: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    }
});

const router = useRouter();

/**
 * 指定されたルートにナビゲートする
 */
const navigate = () => {
    router.push(props.to);
};
</script>