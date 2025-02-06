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
            class="text-5xl font-bold font-['Noto Sans']">
            {{ textDetailPages }}
            </h1>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

// 画像をインポート
import higumaIcon from '@/assets/img/higumaImg/higumaIcon.png';
import jikoIcon from '@/assets/img/jikoImg/jikoIcon.png';
import josetsuIcon from '@/assets/img/josetsuImg/josetsuIcon.png';
import fusinshaIcon from '@/assets/img/fusinshaImg/fusinshaIcon.png';

// 型の定義
interface InformationDetail {
    src: string;
    alt: string;
    text: string;
    color: string;
}

// ルートとアイコン、テキストのマッピング
// elseifを使うより保守性が高いため、データを一括管理するようにしている
const informationData: { [key: string]: InformationDetail } = {
    higuma: { src: higumaIcon, alt: 'ヒグマアイコン', text: 'ヒグマ情報', color: 'text-[#ff3e3e]' },
    jiko: { src: jikoIcon, alt: '事故アイコン', text: '事故情報', color: 'text-[#ffa629]' },
    josetsu: { src: josetsuIcon, alt: '除雪アイコン', text: '除雪情報', color: 'text-[#578cff]' },
    fusinsha: { src: fusinshaIcon, alt: '不審者アイコン', text: '不審者情報', color: 'text-[#4f4f4f]' },
};

const route = useRoute();

/**
 * ルートに応じて情報を表示する
 * @returns {InformationDetail} - 表示する情報の詳細
 */
const informationDetail = computed<InformationDetail>(() => {
    for (const key in informationData) {
        if (route.path.includes(key)) {
            return informationData[key];
        }
    }
    return { src: '', alt: 'デフォルトアイコン', text: 'デフォルト情報', color: 'text-[#000000]' }; // デフォルト値
});

/** アイコンのソースURL */
const iconSrc = computed(() => informationDetail.value.src);

/** アイコンの代替テキスト */
const iconAlt = computed(() => informationDetail.value.alt);

/** テキストの詳細ページ */
const textDetailPages = computed(() => informationDetail.value.text);

/** テキストの色クラス */
const textColorClass = computed(() => informationDetail.value.color);
</script>