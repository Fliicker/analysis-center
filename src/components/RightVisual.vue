<template>
  <div class="right-visual">
    <div ref="container" class="container"></div>
    <!-- <el-dialog v-model="chartVisual" width="900px" id="chart" title="可视化结果">
      <chart-visual :chartVisualInfo="chartVisualInfo"></chart-visual>
    </el-dialog> -->
    <el-dialog
      v-model="dialogVisible"
      :width="300"
      :title="visualType == 'geoJsonLine' ? '断面名称：' : '区域名称：'"
    >
      <div class="name">
        <el-input v-model="inputValue" />
        <div class="btn">
          <el-button type="primary" plain size="small" @click="clickHandle"
            >确定</el-button
          >
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { computed, defineComponent, nextTick, onMounted, ref } from "vue";
import mapBoxGl, { AnySourceData } from "mapbox-gl";
import { getCoordinates, getAnalysisGeoJson, getContent } from "@/api/request";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
export default defineComponent({
  components: {},
  props: {
    layerList: {
      type: Array,
    },
  },
  emits: ["drawHandle"],
  setup(props, context) {
    const container = ref();
    let map;
    // const chartVisual = ref(false);
    const chartVisualInfo = ref();
    const dialogVisible = ref(false);
    const inputValue = ref("");
    const visualType = ref("");

    //{ id: string; coordinates: number[][]; description: string }[]
    const volumeList = ref([]);
    let geoJson;

    const lineDraw = new MapboxDraw({
      controls: {
        combine_features: false,
        uncombine_features: false,
        trash: false,
        point: false,
        polygon: false,
      },
    });

    const polygonDraw = new MapboxDraw({
      controls: {
        combine_features: false,
        uncombine_features: false,
        trash: false,
        point: false,
        line_string: false,
      },
    });

    const operateDraw = (param) => {
      if (param === 0) {
        if (map.hasControl(lineDraw)) {
          map.removeControl(lineDraw);
        }
        if (map.hasControl(polygonDraw)) {
          map.removeControl(polygonDraw);
        }
      } else if (param === 1) {
        if (map.hasControl(polygonDraw)) {
          map.removeControl(polygonDraw);
        }
        if (!map.hasControl(lineDraw)) {
          map.addControl(lineDraw, "top-left");
        }
      } else if (param === 2) {
        if (map.hasControl(lineDraw)) {
          map.removeControl(lineDraw);
        }
        if (!map.hasControl(polygonDraw)) {
          map.addControl(polygonDraw, "top-left");
        }
      }
    };

    const draw = (e) => {
      if (map.hasControl(lineDraw)) {
        visualType.value = "geoJsonLine";
        geoJson = e.features[0];
        dialogVisible.value = true;
        lineDraw.deleteAll();
      }
      if (map.hasControl(polygonDraw)) {
        visualType.value = "geoJsonPolygon";
        geoJson = e.features[0];
        dialogVisible.value = true;
        polygonDraw.deleteAll();
      }
    };

    const clickHandle = () => {
      context.emit("drawHandle", {
        geoJson: geoJson,
        visualType: visualType.value,
        fileName: inputValue.value,
      });
      dialogVisible.value = false;
    };

    const inPolygon = (lon, lat, coordinates, id) => {
      if (
        lon > coordinates[0][0] &&
        lon < coordinates[2][0] &&
        lat > coordinates[2][1] &&
        lat < coordinates[0][1] &&
        map.getLayoutProperty(id, "visibility") != "none"
      ) {
        return true;
      } else {
        return false;
      }
    };

    const initMap = () => {
      map = new mapBoxGl.Map({
        container: container.value,
        accessToken:
          "pk.eyJ1Ijoiam9obm55dCIsImEiOiJja2xxNXplNjYwNnhzMm5uYTJtdHVlbTByIn0.f1GfZbFLWjiEayI6hb_Qvg",
        style: "mapbox://styles/johnnyt/cl9miecpn001t14rspop38nyk",
        center: [121.18, 31.723],
        zoom: 8,
      });
      map.on("load", async () => {
        await initLayers();
      });
      map.doubleClickZoom.disable();
      map.on("dblclick", (e) => {
        for (let i = 0; i < volumeList.value.length; i++) {
          if (
            inPolygon(
              e.lngLat.lng,
              e.lngLat.lat,
              volumeList.value[i].coordinates,
              volumeList.value[i].id
            )
          ) {
            new mapBoxGl.Popup()
              .setLngLat([
                (volumeList.value[i].coordinates[0][0] +
                  volumeList.value[i].coordinates[2][0]) /
                  2,
                (volumeList.value[i].coordinates[0][1] +
                  volumeList.value[i].coordinates[2][1]) /
                  2,
              ])
              .setHTML(volumeList.value[i].description)
              .addTo(map);
          }
        }
      });
    };

    const initLayers = async () => {
      for (let i = props.layerList.length - 1; i >= 0; i--) {
        await addMapLayer(props.layerList[i]);
      }
      map.on("draw.create", draw);
    };

    // param: {
    //   id: string;
    //   visualId: string;
    //   visualType: string;
    // }
    const addMapLayer = async (param) => {
      if (map.getLayer(param.id) === undefined) {
        let type;
        if (
          param.visualType === "lineVectorTile3D" ||
          param.visualType === "lineVectorTile" ||
          param.visualType === "flushContour"
        ) {
          type = "line";
        } else if (
          param.visualType === "pointVectorTile" ||
          param.visualType === "pointVectorTile3D"
        ) {
          type = "circle";
        } else if (
          param.visualType === "polygonVectorTile" ||
          param.visualType === "polygonVectorTile3D"
        ) {
          type = "fill";
        }
        if (
          param.visualType === "lineVectorTile3D" ||
          param.visualType === "lineVectorTile" ||
          param.visualType === "pointVectorTile" ||
          param.visualType === "pointVectorTile3D" ||
          param.visualType === "polygonVectorTile" ||
          param.visualType === "polygonVectorTile3D" ||
          param.visualType === "flushContour"
        ) {
          map.addSource(param.id, {
            type: "vector",
            tiles: [
              `${import.meta.env.VITE_APP_BACK_ADDRESS}visual/getVectorTiles/${
                param.visualId
              }/{x}/{y}/{z}`,
            ],
          });
          map.addLayer({
            id: param.id,
            source: param.id,
            type: type,
            "source-layer": param.visualId,
          });
        } else if (
          param.visualType === "rasterTile" ||
          param.visualType === "elevationFlush" ||
          param.visualType === "slope"
        ) {
          map.addSource(param.id, {
            type: "raster",
            tiles: [
              `${import.meta.env.VITE_APP_BACK_ADDRESS}visual/getRaster/${
                param.visualId
              }/{x}/{y}/{z}`,
            ],
          });
          map.addLayer({
            id: param.id,
            type: "raster",
            source: param.id,
          });
        } else if (
          param.visualType === "png" ||
          param.visualType === "movePng" ||
          param.visualType === "regionFlush"
        ) {
          const coordinates = await getCoordinates(param.visualId);
          if (coordinates != null && coordinates.code === 0) {
            map.addSource(param.id, {
              type: "image",
              url: `${import.meta.env.VITE_APP_BACK_ADDRESS}visual/getPngResource/${
                param.visualId
              }`,
              coordinates: coordinates.data,
            });
            map.addLayer({
              id: param.id,
              type: "raster",
              source: param.id,
            });
          }
        } else if (param.visualType === "volume") {
          const content = await getContent(param.visualId);
          if (content != null && content.code === 0) {
            map.addSource(param.id, {
              type: "image",
              url: `${import.meta.env.VITE_APP_BACK_ADDRESS}visual/getPngResource/${
                param.visualId
              }`,
              coordinates: content.data.coordinates,
            });
            map.addLayer({
              id: param.id,
              type: "raster",
              source: param.id,
            });
            const description = `深度：${content.data.deep}，容积：${content.data.volume}m³`;
            volumeList.value.push({
              id: param.id,
              coordinates: content.data.coordinates,
              description: description,
            });
            // map.on("dblclick", (e) => {
            //   console.log(map.getLayoutProperty(param.id, "visibility"));

            //   const description = `深度：${content.data.deep}，容积：${content.data.volume}㎡`;
            //   console.log(description);
            //   new mapBoxGl.Popup()
            //     .setLngLat([
            //       (content.data.coordinates[1][0] +
            //         content.data.coordinates[0][0]) /
            //         2,
            //       (content.data.coordinates[1][1] +
            //         content.data.coordinates[0][1]) /
            //         2,
            //     ])
            //     .setHTML(description)
            //     .addTo(map);
            // });
          }
        } else if (
          param.visualType === "geoJsonLine" ||
          param.visualType === "geoJsonPoint" ||
          param.visualType === "geoJsonPolygon"
        ) {
          let type = "line";
          if (param.visualType === "geoJsonPoint") {
            type = "circle";
          } else if (param.visualType === "geoJsonPolygon") {
            type = "fill";
          }
          const geojson = await getAnalysisGeoJson(param.id);
          if (geojson != null && geojson.code === 0) {
            map.addSource(param.id, {
              type: "geojson",
              data: geojson.data,
            });
            if (type === "fill") {
              map.addLayer({
                id: param.id,
                type: type,
                source: param.id,
                paint: {
                  "fill-opacity": 0.5,
                  "fill-color": "#f24545",
                },
              });
            } else {
              map.addLayer({
                id: param.id,
                type: type,
                source: param.id,
              });
            }
          }
        }
      }
    };

    // param: {
    //   id: string;
    //   name: string;
    //   visualType: string;
    //   visualId: string;
    // }
    const addChart = async (param) => {
      chartVisualInfo.value = param;
      chartVisual.value = true;
    };

    const removeLayer = (id) => {
      if (map.getLayer(id) != undefined) {
        map.removeLayer(id);
        map.removeSource(id);
        for (let i = 0; i < volumeList.value.length; i++) {
          if (id === volumeList.value[i].id) {
            volumeList.value.splice(i, 1);
            return;
          }
        }
      }
    };

    const moveLayer = (param) => {
      if (param.target === "") {
        map.moveLayer(param.drop);
      } else {
        map.moveLayer(param.drop, param.target);
      }
    };

    const changeLayerState = (param) => {
      if (map.getLayer(param.id) != undefined) {
        if (param.flag) {
          map.setLayoutProperty(param.id, "visibility", "visible");
        } else {
          map.setLayoutProperty(param.id, "visibility", "none");
        }
      }
    };

    const mapResize = () => {
      map.resize();
    };

    onMounted(() => {
      initMap();
    });

    return {
      container,
      mapResize,
      addMapLayer,
      removeLayer,
      changeLayerState,
      operateDraw,
      addChart,
      //chartVisual,
      chartVisualInfo,
      moveLayer,
      dialogVisible,
      inputValue,
      visualType,
      clickHandle,
    };
  },
});
</script>

<style lang="scss" scoped>
.right-visual {
  height: calc(100% - 10px);
  width: 100%;
  position: relative;
  padding: 5px;
  .container {
    height: 100%;
    width: 100%;
    border-radius: 8px;
  }
  :deep() .el-dialog {
    .el-dialog__header {
      padding: 10px;
      background: #4c75a9;
      margin: 0px;
      .el-dialog__title {
        color: white;
      }
      .el-dialog__headerbtn {
        height: 40px;
        .el-icon {
          color: white;
        }
      }
    }
    .el-dialog__body {
      padding: 0px;
    }
  }
  .name {
    padding: 10px;
    height: 70px;
    .btn {
      position: relative;
      margin-top: 10px;
      .el-button {
        position: absolute;
        right: 0px;
      }
    }
  }
}
</style>
