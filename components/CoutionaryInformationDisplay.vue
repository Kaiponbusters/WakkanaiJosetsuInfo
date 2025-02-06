<template>
    <h3 class="flex flex-wrap text-center text-black font-normal font-['Noto Sans']">
        {{ info }}
    </h3>
</template>

<script setup lang="ts">
    const props = defineProps({
        info: String
    });
</script>