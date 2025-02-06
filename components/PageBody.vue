<template>
    <div class="flex flex-col items-center">
        <!-- ページ表示フレーム部-->
        <div class="h-auto mb-10 flex-col justify-start items-center gap-[20px] inline-flex sm:h-auto sm:gap-[20px] w-full">
            <div v-for="(group, index) in sortedGroupedDataList" :key="index" class="w-full">
                <div @click="toggle(index)" class="cursor-pointer bg-gray-200 p-4 w-full text-center text-[32px] font-bold">
                    {{ group.date }}
                </div>
                <div v-if="isOpen(index)" class="w-full">
                    <div v-for="(data, dataIndex) in group.items" :key="dataIndex">
                        <!-- 各種速報情報表示部分 -->
                        <!-- 地域 -->
                        <AreaNameDisplay class="mb-5 mt-5" :area="data.area" />

                        <!-- 地図情報 -->
                        <AreaMapDisplay class="mb-5 mt-5" :latitude="data.latitude" :longitude="data.longitude" />

                        <!-- 注意情報 -->
                        <CoutionaryInformationDisplay v-for="(info, infoIndex) in data.information" :key="infoIndex" :info="info.info" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// import CoutionaryInformationDisplay from './CoutionaryInformationDisplay.vue';
// import AreaNameDisplay from './AreaNameDisplay.vue';
// import AreaMapDisplay from './AreaMapDisplay.vue';

// 型の定義
interface DataItem {
    area: string;
    latitude: number;
    longitude: number;
    information: Array<{ info: string }>;
}

interface Group {
    date: string;
    items: DataItem[];
}

/**
 * グループ化されたデータリスト
 * @type {import('vue').Ref<Group[]>}
 */
const groupedDataList = ref<Group[]>([]);

/**
 * 開閉状態を管理するセット
 * @type {import('vue').Ref<Set<number>>}
 */
const openIndexes = ref<Set<number>>(new Set());

/**
 * 指定されたインデックスの開閉状態を切り替える
 * @param {number} index - 切り替えるインデックス
 */
const toggle = (index: number) => {
    if (openIndexes.value.has(index)) {
        openIndexes.value.delete(index);
    } else {
        openIndexes.value.add(index);
    }
};

/**
 * 指定されたインデックスが開いているかどうかを確認する
 * @param {number} index - 確認するインデックス
 * @returns {boolean} - インデックスが開いている場合はtrue、そうでない場合はfalse
 */
const isOpen = (index: number) => {
    return openIndexes.value.has(index);
};

// テストデータを挿入
// groupedDataList.value = [
//     {
//         date: '2024-12-31',
//         items: [
//             {
//                 area: 'Area 1',
//                 latitude: 45.123,
//                 longitude: 141.123,
//                 information: [
//                     { info: 'Info 1 for Area 1' },
//                     { info: 'Info 2 for Area 1' }
//                 ]
//             },
//             {
//                 area: 'Area 2',
//                 latitude: 45.456,
//                 longitude: 141.456,
//                 information: [
//                     { info: 'Info 1 for Area 2' }
//                 ]
//             }
//         ]
//     },
//     {
//         date: '2024-12-02',
//         items: [
//             {
//                 area: 'Area 3',
//                 latitude: 45.789,
//                 longitude: 141.789,
//                 information: [
//                     { info: 'Info 1 for Area 3' }
//                 ]
//             }
//         ]
//     }
// ];

/**
 * 日付が新しい順にソートされたデータを返すcomputedプロパティ
 * @type {import('vue').ComputedRef<Group[]>}
 */
const sortedGroupedDataList = computed(() => {
    return groupedDataList.value.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});
</script>