<template>
    <div>
        <div class="w-full h-[222px] bg-[#00e5ff]">
            <img :src="mapSrc" alt="Map" class="w-full h-full object-cover" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
    latitude: Number,
    longitude: Number
});

const zoom = 15; // ズームレベル

/**
 * 地図のソースURLを計算する
 * @returns {string} - 地図のソースURL
 */
const mapSrc = computed(() => {
    return `https://static-maps.yandex.ru/1.x/?ll=${props.longitude},${props.latitude}&z=${zoom}&size=600,300&l=map&pt=${props.longitude},${props.latitude},pm2rdm&lang=ja_JP`;
});
</script>