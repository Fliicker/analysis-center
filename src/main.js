import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import '@/assets/iconfont/iconfont.css'
import '@/assets/iconfont/iconfont.js'


const app = createApp(App)

app.use(ElementPlus, {
    locale: zhCn,
});

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

app.use(createPinia())
app.use(router)

app.mount('#app')