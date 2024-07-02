<script setup></script>

<template>
  <div class="main">
    <top-tool
      @returnFileList="returnFileList"
      @operateDraw="operateDraw"
      @analyse="analyse"
    ></top-tool>
    <div class="body">
      <div class="left" ref="left">
        <data-manage
          class="top"
          ref="dataManage"
          @operateLayer="operateLayer"
        ></data-manage>
        <el-skeleton :rows="5" animated class="bottom" v-if="skeletonFlag" />
        <layer-manage
          class="bottom"
          ref="layerManage"
          :layerList="layerList"
          @closeLayer="closeLayer"
          @hideLayer="hideLayer"
          @moveLayer="moveLayer"
          v-else
        ></layer-manage>
        <div class="left-resize" ref="leftResize"></div>
      </div>
      <el-skeleton :rows="5" animated v-if="skeletonFlag" />
      <right-visual
        :layerList="layerList"
        ref="rightMap"
        @drawHandle="drawHandle"
        v-else
      ></right-visual>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, watch, onBeforeUnmount, onMounted } from "vue";
import { getLayersInfo } from "@/api/request";
import TopTool from "@/components/TopTool.vue";
import DataManage from "@/components/DataManage.vue";
import LayerManage from "@/components/LayerManage.vue";
import RightVisual from "@/components/RightVisual.vue";

export default defineComponent({
  components: { TopTool, RightVisual, DataManage, LayerManage },
  setup() {
    const skeletonFlag = ref(true);
    const layerList = ref([]);
    const leftResize = ref();
    const left = ref();
    const rightMap = ref();
    const dataManage = ref();
    const layerManage = ref();

    let eventSource;

    // {
    //     fileId: string;
    //     fileName: string;
    //     dataListId: string;
    //     dataListName: string;
    //     visualType: string;
    //     visualId: string;
    // }[]
    const returnFileList = (val) => {
      dataManage.value.addData(val);
    };

    // {
    //   type: string,
    //   content: {
    //     id: string,
    //     name: string,
    //     visualType: string,
    //     visualId: string,
    //   },
    // }
    const operateLayer = (val) => {
      console.log(val);
      if (val.type === "add") {
        layerManage.value.addLayer(val.content);
        rightMap.value.addMapLayer(val.content);
      } else if (val.type === "del") {
        layerManage.value.delLayer(val.content.id);
        rightMap.value.removeLayer(val.content.id);
      } else if (val.type === "chart") {
        // rightMap.value.addChart(val.content);
      }
    };

    const closeLayer = (val) => {
      rightMap.value.removeLayer(val);
    };

    //{ id: string; flag: boolean }
    const hideLayer = (val) => {
      console.log(val);
      rightMap.value.changeLayerState(val);
    };

    //{ drop: string; target: string }
    const moveLayer = (val) => {
      rightMap.value.moveLayer(val);
    };

    const operateDraw = (val) => {
      rightMap.value.operateDraw(val);
    };

    // val: {
    //   geoJson: any,
    //   visualType: string,
    //   fileName: string,
    // }
    const drawHandle = async (val) => {
      const param = await dataManage.value.addDrawData(val);
      layerManage.value.addLayer(param);
      rightMap.value.addMapLayer(param);
    };

    onMounted(async () => {
      const res = await getLayersInfo(import.meta.env.VITE_APP_ROUTER_ID);
      if (res != null && res.code === 0) {
        layerList.value = res.data;
      }
      skeletonFlag.value = false;
    });

    return {
      leftResize,
      left,
      rightMap,
      returnFileList,
      dataManage,
      operateLayer,
      layerManage,
      closeLayer,
      hideLayer,
      operateDraw,
      drawHandle,
      // analyse,
      skeletonFlag,
      layerList,
      moveLayer,
    };
  },
});
</script>

<style lang="scss" scoped>
.main {
  height: calc(100% - 5rem);
  .body {
    height: 100%;
    display: flex;
    .left {
      width: 30%;
      height: 100%;
      position: relative;
      flex-shrink: 0;
      flex-grow: 0;
      .left-resize {
        position: absolute;
        width: 5px;
        height: 100%;
        top: 0;
        right: 0;
        cursor: col-resize;
      }
      .top {
        height: calc(60% - 10px);
      }
      .bottom {
        height: calc(40% - 10px);
      }
    }
    .right {
      width: 70%;
    }
  }
}
</style>
