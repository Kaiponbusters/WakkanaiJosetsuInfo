<template>
    <div class="w-full">
        <div class="h-auto flex flex-wrap justify-center items-center bg-[#d9d9d9]">
            <h2 class=" text-black text-[24px] text-center font-normal font-['Noto Sans']">
            {{ area }}
            </h2>
        </div>
    </div>
</template>

<script setup lang="ts">
    const props = defineProps({
        area: String
    });
</script>