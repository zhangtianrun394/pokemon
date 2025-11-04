if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  var define_import_meta_env_default$3 = { VITE_SUPABASE_URL: "http://192.168.1.144:8000", VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE", VITE_CJS_IGNORE_WARNING: "true", VITE_ROOT_DIR: "C:/Users/j/Desktop/宝可梦图鉴 - 副本 (2)", VITE_USER_NODE_ENV: "development", BASE_URL: "/", MODE: "development", DEV: true, PROD: false, SSR: false };
  let cachedUrl = "";
  let cachedKey = "";
  function decodeBase64(str) {
    try {
      if (typeof uni !== "undefined" && uni.base64ToArrayBuffer) {
        const buffer = uni.base64ToArrayBuffer(str);
        return String.fromCharCode.apply(null, new Uint8Array(buffer));
      }
      return atob(str);
    } catch (e) {
      formatAppLog("error", "at src/lib/pokeData.js:19", "[Base64] 解码失败:", e);
      return "";
    }
  }
  async function ensureEnvLoaded() {
    if (cachedUrl && cachedKey)
      return;
    try {
      const envObj = typeof { url: _documentCurrentScript && _documentCurrentScript.src || new URL("app-service.js", document.baseURI).href } !== "undefined" && define_import_meta_env_default$3 ? define_import_meta_env_default$3 : {};
      if (!cachedUrl && envObj && envObj.VITE_SUPABASE_URL)
        cachedUrl = envObj.VITE_SUPABASE_URL;
      if (!cachedKey && envObj && envObj.VITE_SUPABASE_ANON_KEY)
        cachedKey = envObj.VITE_SUPABASE_ANON_KEY;
    } catch (e) {
    }
    if (!cachedUrl || !cachedKey) {
      const tryFetch = (path) => new Promise((resolve) => {
        uni.request({
          url: path,
          method: "GET",
          success: (res) => {
            const cfg = res && res.data ? res.data : null;
            if (cfg && cfg.supabaseUrl) {
              cachedUrl = cachedUrl || String(cfg.supabaseUrl);
              if (cfg.encodedKey) {
                try {
                  const decoded = decodeBase64(cfg.encodedKey);
                  cachedKey = cachedKey || decoded.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\r?\n/g, "").trim();
                } catch (e) {
                  formatAppLog("warn", "at src/lib/pokeData.js:56", "[SupabaseEnv] Base64 解码失败:", e);
                }
              } else if (cfg.keyPart1 && cfg.keyPart2 && cfg.keyPart3) {
                const reconstructedKey = cfg.keyPart1 + "." + cfg.keyPart2 + "." + cfg.keyPart3;
                cachedKey = cachedKey || reconstructedKey.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\r?\n/g, "").trim();
              } else if (cfg.supabaseAnonKey) {
                const rawKey = String(cfg.supabaseAnonKey);
                cachedKey = cachedKey || rawKey.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\r?\n/g, "").trim();
              }
            }
            resolve(true);
          },
          fail: () => resolve(false)
        });
      });
      await tryFetch("/static/app-config.json");
      if (!cachedUrl || !cachedKey) {
        await tryFetch("static/app-config.json");
      }
      if (!cachedUrl)
        cachedUrl = "https://ppyigzumhwpvmkfxrjpv.supabase.co";
      if (!cachedKey) {
        const encodedDefault = "ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5TG1WNVNuTnpJblZ3WVdKaGMyVWlMQ0p5WldZaU9pSndjSGw1YVdkNmRXMW9kM0IyYldzbWVISnFjSFpqSWl3aWNtOXNaU0k2SW1GdWIyNGlMQ0pwWVhRaU9qRTNOakE0TlRZNU9EWXNJbVY0Y0NJNk1qQTNOalF6TWprek9EWjlMbmR5VlVGWlgzQnlWRE5zT0V0VFMzVmhaVVpzWVZVemJIQXllV0ZxTm5ocVJreHpiamdmUzFobVFVVT0=";
        cachedKey = decodeBase64(encodedDefault);
      }
    }
  }
  function setSupabaseConfig(url, key) {
    if (url)
      cachedUrl = url;
    if (key)
      cachedKey = key;
  }
  function buildQuery(params) {
    const parts = [];
    for (var k in params) {
      if (Object.prototype.hasOwnProperty.call(params, k)) {
        parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
      }
    }
    return parts.length ? "?" + parts.join("&") : "";
  }
  async function initSupabaseEnv() {
    await ensureEnvLoaded();
    formatAppLog("log", "at src/lib/pokeData.js:104", "[版本检查] pokeData.js 已更新 - 2025-01-28-v9-color-abilities-fix");
  }
  function debugSupabaseEnv(tag = "debug") {
    const url = cachedUrl || "(empty)";
    const key = cachedKey ? cachedKey.slice(0, 8) + "..." : "(empty)";
    const keyLen = cachedKey ? String(cachedKey).length : 0;
    formatAppLog("log", "at src/lib/pokeData.js:111", `[SupabaseEnv:${tag}] url=`, url, " key=", key, " len=", keyLen);
  }
  async function buildRest(path, params) {
    await ensureEnvLoaded();
    if (!cachedUrl || !cachedKey) {
      formatAppLog("error", "at src/lib/pokeData.js:117", "[SupabaseEnv] missing url/key before buildRest:", { url: cachedUrl, keyHead: cachedKey ? cachedKey.slice(0, 8) : "" });
      throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
    }
    const qs = buildQuery(params || {});
    const full = cachedUrl.replace(/\/$/, "") + "/rest/v1/" + path + (qs || "");
    const keyClean = String(cachedKey).replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\r?\n/g, "").trim();
    let headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "apikey": keyClean,
      "Authorization": `Bearer ${keyClean}`
    };
    formatAppLog("log", "at src/lib/pokeData.js:129", "[SupabaseEnv] using url=", cachedUrl, " keyHead=", (cachedKey || "").slice(0, 8));
    return { full, headers };
  }
  function uniGet(path, params) {
    return new Promise(async (resolve, reject) => {
      let conf;
      try {
        conf = await buildRest(path, params);
      } catch (e) {
        reject(e);
        return;
      }
      formatAppLog("log", "at src/lib/pokeData.js:143", "[请求诊断] URL:", conf.full);
      formatAppLog("log", "at src/lib/pokeData.js:144", "[请求诊断] Headers:", JSON.stringify(conf.headers, null, 2));
      uni.request({
        url: conf.full,
        method: "GET",
        header: conf.headers,
        success: (res) => {
          formatAppLog("log", "at src/lib/pokeData.js:151", "[请求诊断] 响应状态:", res.statusCode);
          formatAppLog("log", "at src/lib/pokeData.js:152", "[请求诊断] 响应数据:", JSON.stringify(res.data).slice(0, 200));
          if (res.statusCode >= 200 && res.statusCode < 300)
            resolve(res.data || []);
          else
            reject(new Error("HTTP " + res.statusCode + ": " + JSON.stringify(res.data)));
        },
        fail: (err) => {
          formatAppLog("log", "at src/lib/pokeData.js:157", "[请求诊断] 请求失败:", JSON.stringify(err));
          reject(err);
        }
      });
    });
  }
  function normalizeTypeLocal(t) {
    if (!t)
      return "";
    const s = String(t).trim().toLowerCase();
    const map = {
      "火": "fire",
      "fire": "fire",
      "水": "water",
      "water": "water",
      "草": "grass",
      "grass": "grass",
      "电": "electric",
      "雷": "electric",
      "electric": "electric",
      "毒": "poison",
      "poison": "poison",
      "一般": "normal",
      "normal": "normal",
      "超能力": "psychic",
      "psychic": "psychic",
      "飞行": "flying",
      "flying": "flying",
      "幽灵": "ghost",
      "ghost": "ghost",
      "龙": "dragon",
      "dragon": "dragon",
      "岩石": "rock",
      "rock": "rock",
      "地面": "ground",
      "ground": "ground",
      "钢": "steel",
      "steel": "steel",
      "恶": "dark",
      "dark": "dark",
      "妖精": "fairy",
      "fairy": "fairy",
      "冰": "ice",
      "ice": "ice",
      "虫": "bug",
      "bug": "bug",
      "格斗": "fighting",
      "fighting": "fighting"
    };
    return map[s] || s;
  }
  async function fetchPokemonFormsFull() {
    try {
      const rows = await uniGet("forms", {
        select: "pokemon_id,forms_id,form_name,types,image",
        order: "forms_id.asc",
        limit: "5000"
      });
      return rows.map((r) => ({
        pokemon_id: r.pokemon_id,
        forms_id: r.forms_id,
        form_name: r.form_name,
        types: r.types,
        image: r.image
      }));
    } catch (e) {
      const rows = await uniGet("forms", {
        select: "pokemon_id,form_id,form_name,types,image",
        order: "form_id.asc",
        limit: "5000"
      });
      return rows.map((r) => ({
        pokemon_id: r.pokemon_id,
        forms_id: r.form_id,
        // 别名
        form_name: r.form_name,
        types: r.types,
        image: r.image
      }));
    }
  }
  async function fetchFormsTypes() {
    try {
      const rows = await uniGet("forms_types", {
        select: "forms_id,type_id",
        order: "forms_id.asc",
        limit: "20000"
      });
      return rows.map((r) => ({ forms_id: r.forms_id, type_id: r.type_id }));
    } catch (e) {
      const rows = await uniGet("forms_types", {
        select: "form_id,type_id",
        order: "form_id.asc",
        limit: "20000"
      });
      return rows.map((r) => ({ forms_id: r.form_id, type_id: r.type_id }));
    }
  }
  async function fetchTypesAll() {
    const candidates = [
      "type_id,type_name",
      "id,type_name",
      "type_id,name",
      "id,name"
    ];
    for (const select of candidates) {
      try {
        const rows = await uniGet("types", { select, limit: "2000" });
        if (rows && rows.length > 0) {
          formatAppLog("log", "at src/lib/pokeData.js:251", `[诊断] 成功读取 types 表, 使用字段: '${select}', 返回 ${rows.length} 条记录`);
          if (select.startsWith("id,")) {
            return rows.map((r) => {
              var _a;
              return { type_id: r.id, type_name: (_a = r.type_name) != null ? _a : r.name };
            });
          }
          if (select.includes(",name")) {
            return rows.map((r) => ({ type_id: r.type_id, type_name: r.name }));
          }
          return rows;
        }
      } catch (e) {
        formatAppLog("warn", "at src/lib/pokeData.js:261", `[诊断] 尝试读取 types 表失败, 使用字段: '${select}'. 错误:`, e.message);
      }
    }
    formatAppLog("error", "at src/lib/pokeData.js:264", "[诊断] types 表所有字段组合读取尝试均失败，请检查 RLS/列名/表权限。");
    return [];
  }
  async function fetchPokemonImages() {
    return await uniGet("images", {
      select: "pokemon_id,image",
      limit: "2000"
    });
  }
  async function fetchAllForHomeJunction() {
    await initSupabaseEnv();
    debugSupabaseEnv("home");
    const [formsResult, imagesResult, formsTypesResult, typesResult] = await Promise.allSettled([
      fetchPokemonFormsFull(),
      fetchPokemonImages(),
      fetchFormsTypes(),
      fetchTypesAll()
    ]);
    const errors = [];
    const getVal = (result, index) => {
      var _a, _b;
      if (result.status === "fulfilled")
        return result.value || [];
      errors.push({ index, reason: String((_b = (_a = result.reason) == null ? void 0 : _a.message) != null ? _b : result.reason) });
      return [];
    };
    const forms = getVal(formsResult, 0);
    const images = getVal(imagesResult, 1);
    const formsTypes = getVal(formsTypesResult, 2);
    const types = getVal(typesResult, 3);
    formatAppLog("log", "at src/lib/pokeData.js:298", "[诊断] forms数:", forms.length, "forms_types数:", formsTypes.length, "types数:", types.length);
    const formIdToTypeIds = /* @__PURE__ */ new Map();
    for (const ft of formsTypes) {
      const fid = ft.forms_id;
      const tid = ft.type_id;
      if (fid != null && tid != null) {
        if (!formIdToTypeIds.has(fid))
          formIdToTypeIds.set(fid, []);
        formIdToTypeIds.get(fid).push(tid);
      }
    }
    const typeIdToName = /* @__PURE__ */ new Map();
    for (const t of types) {
      if (t && t.type_id != null)
        typeIdToName.set(t.type_id, t.type_name);
    }
    if (types.length === 0) {
      formatAppLog("warn", "at src/lib/pokeData.js:315", "[诊断] types 映射为空，属性名称将回退自 forms.types 或显示为空");
    }
    const pidToImage = /* @__PURE__ */ new Map();
    for (const im of images) {
      if (im && im.pokemon_id != null && im.image)
        pidToImage.set(im.pokemon_id, im.image);
    }
    const data = forms.map((f) => {
      const formId = f.forms_id;
      const pnameZh = f.form_name || "";
      let typesZh = [];
      const idsByForm = formIdToTypeIds.get(formId) || [];
      if (idsByForm.length) {
        typesZh = idsByForm.map((id) => typeIdToName.get(id)).filter(Boolean);
      } else {
        if (formsTypes.length > 0)
          ;
        let raw = [];
        if (Array.isArray(f.types))
          raw = f.types;
        else if (typeof f.types === "string")
          raw = String(f.types).split(",").map((s) => s.trim()).filter(Boolean);
        typesZh = raw;
      }
      const typesEn = (typesZh || []).map((t) => normalizeTypeLocal(t)).filter(Boolean);
      const imageName = f.image ? String(f.image) : pidToImage.get(f.pokemon_id) || "";
      return {
        id: f.pokemon_id,
        forms_id: formId,
        nameZh: pnameZh,
        typesZh,
        typesEn,
        imageName
      };
    });
    if (errors.length) {
      formatAppLog("warn", "at src/lib/pokeData.js:356", "部分数据获取失败（已降级为空数组）", errors);
    }
    return { data, errors, formsCount: forms.length };
  }
  async function probeTable(tableName) {
    try {
      const conf = await buildRest(String(tableName), { select: "*", limit: "1" });
      const res = await new Promise((resolve, reject) => {
        uni.request({ url: conf.full, method: "GET", header: conf.headers, success: resolve, fail: reject });
      });
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return { ok: true, status: res.statusCode };
      }
      return { ok: false, status: res.statusCode, error: JSON.stringify(res.data) };
    } catch (e) {
      return { ok: false, status: 0, error: String(e && e.message ? e.message : e) };
    }
  }
  async function fetchPokemonDetailOptimized(formsId) {
    await initSupabaseEnv();
    try {
      const form = await uniGet("forms", {
        select: "forms_id,pokemon_id,form_name,image,genus,height,weight,shape,color,types",
        forms_id: `eq.${formsId}`,
        limit: 1
      }).then((r) => r[0]);
      if (!form) {
        throw new Error("Form not found");
      }
      const [pokemon, abilities] = await Promise.all([
        // 并行查询1: 获取pokemon基础信息
        uniGet("pokemons", {
          select: "index,name,name_en,name_jp,profile,poke_id",
          index: `eq.${form.pokemon_id}`,
          name: `eq.${form.form_name}`,
          limit: 1
        }).then((r) => r[0] || null),
        // 并行查询2: 获取abilities信息（嵌套并行查询）
        (async () => {
          const pokemonForAbility = await uniGet("pokemons", {
            select: "poke_id",
            index: `eq.${form.pokemon_id}`,
            name: `eq.${form.form_name}`,
            limit: 1
          }).then((r) => r[0]);
          if (!pokemonForAbility)
            return [];
          const [pokemonAbilities, allAbilities] = await Promise.all([
            uniGet("pokemon_abilities", {
              select: "ability_id,is_hidden",
              poke_id: `eq.${pokemonForAbility.poke_id}`
            }),
            // 预先获取所有可能需要的ability详情（减少查询次数）
            uniGet("abilities", {
              select: "ability_id,name,description"
            })
          ]);
          if (!pokemonAbilities || pokemonAbilities.length === 0)
            return [];
          return pokemonAbilities.map((pa) => {
            const detail = allAbilities.find((ad) => ad.ability_id === pa.ability_id);
            return {
              name: detail ? detail.name : "未知特性",
              description: detail ? detail.description : "暂无描述",
              is_hidden: pa.is_hidden
            };
          });
        })()
      ]);
      let typesZh = [];
      let typesEn = [];
      const typeMap = {
        "草": "grass",
        "毒": "poison",
        "火": "fire",
        "水": "water",
        "电": "electric",
        "一般": "normal",
        "超能力": "psychic",
        "飞行": "flying",
        "幽灵": "ghost",
        "龙": "dragon",
        "岩石": "rock",
        "地面": "ground",
        "钢": "steel",
        "恶": "dark",
        "妖精": "fairy",
        "冰": "ice",
        "虫": "bug",
        "格斗": "fighting"
      };
      if (form.types) {
        try {
          if (typeof form.types === "string") {
            const types = JSON.parse(form.types);
            if (Array.isArray(types)) {
              typesZh = types;
            } else {
              typesZh = [types];
            }
          } else if (Array.isArray(form.types)) {
            typesZh = form.types;
          }
          typesEn = typesZh.map((t) => typeMap[t] || "normal");
        } catch (e) {
          formatAppLog("warn", "at src/lib/pokeData.js:680", "解析types失败:", e);
          typesZh = ["未知"];
          typesEn = ["normal"];
        }
      }
      return {
        form: {
          ...form,
          typesZh,
          typesEn
        },
        pokemon: pokemon || {},
        abilities: abilities || []
      };
    } catch (error) {
      formatAppLog("error", "at src/lib/pokeData.js:697", "[fetchPokemonDetailOptimized] 查询失败:", error);
      throw error;
    }
  }
  const _imports_0$1 = "/static/quick-ball.png";
  const _imports_0 = "/static/xiaozhi.png";
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$6 = {
    data() {
      return {
        isLoading: true,
        searchTerm: "",
        sortAscending: true,
        activePage: "pokedex",
        pokemonData: [],
        navItems: [
          { page: "pokedex", label: "图鉴" },
          { page: "community", label: "社区" },
          { page: "moves", label: "招式与特性" },
          { page: "profile", label: "我的" }
        ],
        displayName: "训练师",
        // 社区状态
        communitySearch: "",
        communityPosts: [
          {
            id: 1,
            avatar: "https://ai-public.mastergo.com/ai/img_res/a80f1e0b5ba3d38b3dccce7abc7d0323.jpg",
            username: "小智",
            time: "2小时前",
            content: "今天终于收服了皮卡丘！太开心了！",
            image: "https://ai-public.mastergo.com/ai/img_res/c4105702bb313ebec27e968031c6d893.jpg",
            video: "",
            likes: 42,
            liked: false,
            comments: 8,
            favorites: 5,
            favorited: false,
            commentList: [
              { username: "小霞", content: "恭喜恭喜！皮卡丘很可爱呢！", time: "1小时前" },
              { username: "小刚", content: "训练家之路开始了，加油！", time: "45分钟前" },
              { username: "火箭队", content: "既然你诚心诚意地发问了，我们就大发慈悲地告诉你！", time: "30分钟前" }
            ]
          },
          {
            id: 2,
            avatar: "https://ai-public.mastergo.com/ai/img_res/b588a136138a2352b71cd8ed9de76b44.jpg",
            username: "小霞",
            time: "5小时前",
            content: "分享我的水系宝可梦队伍，大家觉得怎么样？",
            image: "https://ai-public.mastergo.com/ai/img_res/ada19814eaea4d830cfd461c0cf34bfd.jpg",
            video: "",
            likes: 36,
            liked: true,
            comments: 12,
            favorites: 7,
            favorited: true,
            commentList: [
              { username: "小智", content: "水系宝可梦很强大！", time: "4小时前" },
              { username: "小刚", content: "队伍搭配很合理！", time: "3小时前" }
            ]
          },
          {
            id: 3,
            avatar: "https://ai-public.mastergo.com/ai/img_res/a7b871a3280c087cd6f9ea3857f8606a.jpg",
            username: "小刚",
            time: "昨天",
            content: "岩石系宝可梦培养心得分享视频",
            image: "",
            video: "https://ai-public.mastergo.com/ai/img_res/b08e7758a877a52aa6bb4b0ce3cbe060.jpg",
            likes: 28,
            liked: false,
            comments: 5,
            favorites: 3,
            favorited: false,
            commentList: [
              { username: "小智", content: "学到了很多，谢谢分享！", time: "昨天" },
              { username: "小霞", content: "视频讲解很详细！", time: "昨天" }
            ]
          }
        ],
        currentPostIndex: 0,
        currentComments: [],
        showCommentModal: false,
        commentInput: "",
        showPostModal: false,
        postTextarea: "",
        dragging: false,
        dragStart: { x: 0, y: 0 },
        btnStart: { x: 0, y: 0 },
        communityBtn: { x: 12, y: 300 }
      };
    },
    computed: {
      filteredPokemon() {
        let filtered = this.pokemonData.filter((pokemon) => {
          const name = pokemon.name.toLowerCase();
          const nameEn = pokemon.nameEn.toLowerCase();
          const search = this.searchTerm.toLowerCase();
          return name.includes(search) || nameEn.includes(search);
        });
        return filtered.sort((a, b) => {
          return this.sortAscending ? a.id - b.id : b.id - a.id;
        });
      },
      filteredCommunityPosts() {
        const q = (this.communitySearch || "").toLowerCase();
        if (!q)
          return this.communityPosts;
        return this.communityPosts.filter((p) => (p.username || "").toLowerCase().includes(q) || (p.content || "").toLowerCase().includes(q));
      }
    },
    async onLoad(options) {
      try {
        if (options && options.page) {
          this.activePage = String(options.page);
        }
        const resCfg = await new Promise((resolve) => {
          uni.request({ url: "/static/app-config.json", method: "GET", success: resolve, fail: resolve });
        });
        const appCfg = resCfg && resCfg.data ? resCfg.data : {};
        const baseRaw = "" ? "" : "http://192.168.1.144:8000";
        const keyRaw = "" ? "" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE";
        if (baseRaw && keyRaw) {
          setSupabaseConfig(String(baseRaw), String(keyRaw));
        }
        try {
          const u = uni.getStorageSync("user");
          if (u && u.name) {
            this.displayName = u.name;
          } else if (this.activePage === "profile") {
            uni.navigateTo({ url: "/pages/login/index" });
          }
        } catch (e) {
        }
        await this.fetchPokemons();
      } catch (e) {
        formatAppLog("error", "at pages/index/index.vue:343", "首屏加载失败", e);
        uni.showModal({
          title: "首屏加载失败",
          content: e && e.message ? String(e.message).slice(0, 120) : "未知错误",
          confirmText: "去自检",
          cancelText: "取消",
          success: (res) => {
            if (res.confirm)
              uni.navigateTo({ url: "/pages/debug/config" });
          }
        });
      } finally {
        this.isLoading = false;
        this.generateBackgroundPattern();
      }
    },
    onShow() {
      try {
        const np = uni.getStorageSync("newPost");
        if (np) {
          this.communityPosts.unshift(np);
          uni.removeStorageSync("newPost");
        }
      } catch (e) {
      }
    },
    methods: {
      // 社区数据与交互
      goBack() {
        this.activePage = "pokedex";
      },
      createPost() {
        uni.navigateTo({ url: "/pages/community/create" });
      },
      closePostModal() {
        this.showPostModal = false;
      },
      submitPost() {
        const content = (this.postTextarea || "").trim();
        if (!content)
          return;
        const newPost = {
          id: this.communityPosts.length + 1,
          avatar: "https://ai-public.mastergo.com/ai/img_res/a80f1e0b5ba3d38b3dccce7abc7d0323.jpg",
          username: this.displayName || "我",
          time: "刚刚",
          content,
          image: "",
          video: "",
          likes: 0,
          liked: false,
          comments: 0,
          favorites: 0,
          favorited: false,
          commentList: []
        };
        this.communityPosts.unshift(newPost);
        this.showPostModal = false;
      },
      showComment(index) {
        var _a;
        this.currentPostIndex = index;
        this.currentComments = [...((_a = this.communityPosts[index]) == null ? void 0 : _a.commentList) || []];
        this.commentInput = "";
        this.showCommentModal = true;
      },
      closeCommentModal() {
        this.showCommentModal = false;
        this.commentInput = "";
      },
      sendComment() {
        const content = (this.commentInput || "").trim();
        if (!content)
          return;
        const post = this.communityPosts[this.currentPostIndex];
        if (!post)
          return;
        post.commentList.unshift({ username: this.displayName || "我", content, time: "刚刚" });
        post.comments++;
        this.currentComments = [...post.commentList];
        this.commentInput = "";
      },
      toggleLike(index) {
        const p = this.communityPosts[index];
        if (!p)
          return;
        p.liked = !p.liked;
        p.likes += p.liked ? 1 : -1;
      },
      toggleFavorite(index) {
        const p = this.communityPosts[index];
        if (!p)
          return;
        p.favorited = !p.favorited;
        p.favorites += p.favorited ? 1 : -1;
      },
      startDrag(e) {
        this.dragging = true;
        const t = e.touches && e.touches[0] ? e.touches[0] : { clientX: 0, clientY: 0 };
        this.dragStart.x = t.clientX;
        this.dragStart.y = t.clientY;
        this.btnStart.x = this.communityBtn.x;
        this.btnStart.y = this.communityBtn.y;
      },
      onDrag(e) {
        if (!this.dragging)
          return;
        const t = e.touches && e.touches[0] ? e.touches[0] : { clientX: 0, clientY: 0 };
        const dx = t.clientX - this.dragStart.x;
        const dy = t.clientY - this.dragStart.y;
        const w = uni.getSystemInfoSync().windowWidth;
        const h = uni.getSystemInfoSync().windowHeight;
        const size = 60;
        this.communityBtn.x = Math.max(0, Math.min(w - size, this.btnStart.x + dx));
        this.communityBtn.y = Math.max(0, Math.min(h - size - 90, this.btnStart.y + dy));
      },
      endDrag() {
        this.dragging = false;
      },
      // 原有首页数据逻辑
      async fetchPokemons() {
        try {
          const resp = await fetchAllForHomeJunction();
          formatAppLog("log", "at pages/index/index.vue:434", "诊断信息 - formsCount:", resp == null ? void 0 : resp.formsCount, "maxFormId:", resp == null ? void 0 : resp.maxFormId);
          if (resp == null ? void 0 : resp.maxFormId) {
            uni.showToast({
              title: `加载${resp.formsCount}条，最大ID:${resp.maxFormId}`,
              icon: "none",
              duration: 3e3
            });
          }
          const allArr = resp && resp.data ? resp.data.map((item) => ({
            id: item.id,
            forms_id: item.forms_id,
            // 使用 forms_id
            name: item.nameZh,
            nameEn: "",
            types: item.typesEn,
            typesZh: item.typesZh,
            imageName: item.imageName
          })) : [];
          this.pokemonData = [];
          const chunkSize = 80;
          let i = 0;
          const appendChunk = () => {
            if (i === 0 && allArr.length) {
              this.isLoading = false;
            }
            const slice = allArr.slice(i, i + chunkSize);
            if (slice.length)
              this.pokemonData = this.pokemonData.concat(slice);
            i += chunkSize;
            if (i < allArr.length) {
              setTimeout(appendChunk, 0);
            }
          };
          appendChunk();
          if (this.pokemonData.length === 0) {
            uni.showToast({ title: "未加载到数据（0 条）", icon: "none", duration: 2500 });
          }
        } catch (err) {
          formatAppLog("error", "at pages/index/index.vue:466", "加载宝可梦失败", err);
          const msg = err && err.message ? String(err.message).slice(0, 120) : "";
          uni.showModal({
            title: "数据加载失败",
            content: (msg ? "错误信息：" + msg + "\n\n" : "") + "是否前往“配置自检”页面进行排查？",
            confirmText: "前往",
            cancelText: "取消",
            success: (res) => {
              if (res.confirm) {
                uni.navigateTo({ url: "/pages/debug/config" });
              }
            }
          });
          return;
        } finally {
          this.isLoading = false;
        }
      },
      normalizeType(t) {
        if (!t)
          return "";
        const s = String(t).trim().toLowerCase();
        const map = {
          "fire": "fire",
          "火": "fire",
          "water": "water",
          "水": "water",
          "grass": "grass",
          "草": "grass",
          "electric": "electric",
          "电": "electric",
          "雷": "electric",
          "poison": "poison",
          "毒": "poison",
          "normal": "normal",
          "一般": "normal",
          "psychic": "psychic",
          "超能力": "psychic",
          "flying": "flying",
          "飞行": "flying",
          "ghost": "ghost",
          "幽灵": "ghost",
          "dragon": "dragon",
          "龙": "dragon"
        };
        return map[s] || s;
      },
      getLocalImageSrc(name) {
        if (!name)
          return "";
        const s = String(name);
        if (s.startsWith("http://") || s.startsWith("https://"))
          return s;
        if (s.startsWith("/static/"))
          return s;
        return `/static/assets/pokemons_image/official/${s}`;
      },
      getTypeEmoji(type) {
        switch ((type || "").toLowerCase()) {
          case "fire":
            return "🔥";
          case "water":
            return "💧";
          case "grass":
            return "🌱";
          case "electric":
            return "⚡";
          case "ghost":
            return "👻";
          case "dragon":
            return "🐲";
          case "normal":
            return "🐾";
          default:
            return "✨";
        }
      },
      getTypeName(type) {
        const typeMap = {
          "fire": "火",
          "water": "水",
          "grass": "草",
          "electric": "电",
          "poison": "毒",
          "normal": "一般",
          "psychic": "超能力",
          "flying": "飞行",
          "ghost": "幽灵",
          "dragon": "龙"
        };
        return typeMap[type] || type;
      },
      toggleMenu() {
        uni.showToast({
          title: "菜单功能开发中",
          icon: "none"
        });
      },
      goConfig() {
        uni.navigateTo({ url: "/pages/debug/config" });
      },
      startVoiceSearch() {
        uni.showToast({
          title: "语音搜索开发中",
          icon: "none"
        });
      },
      handleSearch() {
      },
      clearSearch() {
        this.searchTerm = "";
      },
      toggleSort() {
        this.sortAscending = !this.sortAscending;
      },
      selectPokemon(pokemon) {
        uni.navigateTo({
          url: `/pages/detail/detail?forms_id=${pokemon.forms_id}`
        });
      },
      switchPage(page) {
        if (page === "profile") {
          try {
            const u = uni.getStorageSync("user");
            if (u && u.name) {
              this.displayName = u.name;
              this.activePage = "profile";
              return;
            }
          } catch (e) {
          }
          uni.navigateTo({ url: "/pages/login/index" });
          return;
        }
        this.activePage = page;
      },
      logout() {
        try {
          uni.removeStorageSync("user");
        } catch (e) {
        }
        this.displayName = "训练师";
        this.activePage = "pokedex";
        uni.showToast({ title: "已退出登录", icon: "none" });
      },
      openFavorites() {
        uni.showToast({ title: "我的收藏开发中", icon: "none" });
      },
      openTeam() {
        uni.showToast({ title: "我的队伍开发中", icon: "none" });
      },
      generateBackgroundPattern() {
        try {
          if (typeof document === "undefined")
            return;
          const el = document.getElementById("pattern-container");
          if (!el)
            return;
          el.innerHTML = "";
          el.style.backgroundImage = "radial-gradient(circle at 10% 20%, rgba(255,255,255,0.3) 0, transparent 40%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.25) 0, transparent 35%), radial-gradient(circle at 30% 80%, rgba(255,255,255,0.2) 0, transparent 45%)";
          el.style.backgroundSize = "cover";
        } catch (e) {
        }
      }
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 加载界面 "),
      vue.createElementVNode(
        "view",
        {
          class: vue.normalizeClass(["loading", { hide: !$data.isLoading }])
        },
        [
          vue.createElementVNode("view", { class: "loading-ball" })
        ],
        2
        /* CLASS */
      ),
      vue.createCommentVNode(" 背景图案 "),
      vue.createElementVNode("view", {
        class: "background-pattern",
        id: "pattern-container"
      }),
      vue.createCommentVNode(" 状态栏 "),
      vue.createElementVNode("view", { class: "status-bar" }, [
        vue.createElementVNode("view", { class: "icons" }, [
          vue.createElementVNode("view", { class: "icon" }),
          vue.createElementVNode("view", { class: "icon" })
        ])
      ]),
      vue.createCommentVNode(" 头部（仅图鉴页显示） "),
      $data.activePage !== "community" ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "header"
      }, [
        vue.createElementVNode("text", { class: "title" }, "宝可梦图鉴"),
        vue.createElementVNode("view", { class: "header-buttons" }, [
          vue.createElementVNode("view", {
            class: "pokeball-icon",
            onClick: _cache[0] || (_cache[0] = (...args) => $options.toggleMenu && $options.toggleMenu(...args))
          }),
          vue.createElementVNode("view", {
            class: "debug-fab",
            onClick: _cache[1] || (_cache[1] = (...args) => $options.goConfig && $options.goConfig(...args))
          }, "调试")
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 搜索栏（仅图鉴与招式与特性页显示） "),
      $data.activePage === "pokedex" || $data.activePage === "moves" ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "search-bar"
      }, [
        vue.createElementVNode("view", { class: "search-container" }, [
          vue.withDirectives(vue.createElementVNode("input", {
            type: "text",
            placeholder: $data.activePage === "moves" ? "搜索招式与特性" : "搜索宝可梦",
            "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.searchTerm = $event),
            onInput: _cache[3] || (_cache[3] = (...args) => $options.handleSearch && $options.handleSearch(...args))
          }, null, 40, ["placeholder"]), [
            [vue.vModelText, $data.searchTerm]
          ]),
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["clear-search", { visible: $data.searchTerm.length > 0 }]),
              onClick: _cache[4] || (_cache[4] = (...args) => $options.clearSearch && $options.clearSearch(...args))
            },
            null,
            2
            /* CLASS */
          ),
          vue.createElementVNode("view", {
            class: "voice-search",
            onClick: _cache[5] || (_cache[5] = (...args) => $options.startVoiceSearch && $options.startVoiceSearch(...args))
          })
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 排序选项（仅图鉴页显示） "),
      $data.activePage !== "community" ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "sort-options"
      }, [
        vue.createElementVNode("text", null, "属性"),
        vue.createElementVNode(
          "button",
          {
            class: "sort-button",
            onClick: _cache[6] || (_cache[6] = (...args) => $options.toggleSort && $options.toggleSort(...args))
          },
          vue.toDisplayString($data.sortAscending ? "↓↑排序" : "↑↓排序"),
          1
          /* TEXT */
        )
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 宝可梦网格 "),
      $data.activePage === "pokedex" ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 3,
        class: "pokemon-grid"
      }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($options.filteredPokemon, (pokemon, index) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              key: pokemon.forms_id,
              class: "pokemon-card",
              style: vue.normalizeStyle({ animationDelay: index * 50 + "ms" }),
              onClick: ($event) => $options.selectPokemon(pokemon)
            }, [
              vue.createElementVNode("view", { class: "pokemon-image" }, [
                pokemon.imageName ? (vue.openBlock(), vue.createElementBlock("image", {
                  key: 0,
                  src: $options.getLocalImageSrc(pokemon.imageName),
                  mode: "aspectFit",
                  style: { "width": "100%", "height": "100%" },
                  "lazy-load": "true"
                }, null, 8, ["src"])) : (vue.openBlock(), vue.createElementBlock(
                  "text",
                  { key: 1 },
                  vue.toDisplayString($options.getTypeEmoji(pokemon.types[0])),
                  1
                  /* TEXT */
                ))
              ]),
              vue.createElementVNode(
                "text",
                { class: "pokemon-number" },
                "No." + vue.toDisplayString(pokemon.id.toString().padStart(3, "0")),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "text",
                { class: "pokemon-name" },
                vue.toDisplayString(pokemon.name),
                1
                /* TEXT */
              ),
              vue.createCommentVNode(" 不再展示英文名 "),
              vue.createElementVNode("view", { class: "pokemon-types" }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList(pokemon.typesZh || [], (typeZh, idx) => {
                    return vue.openBlock(), vue.createElementBlock(
                      "view",
                      {
                        key: typeZh + "_" + idx,
                        class: vue.normalizeClass(["type", "type-" + (pokemon.types[idx] || "")])
                      },
                      vue.toDisplayString(typeZh),
                      3
                      /* TEXT, CLASS */
                    );
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ])
            ], 12, ["onClick"]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ])) : $data.activePage === "community" ? (vue.openBlock(), vue.createElementBlock(
        vue.Fragment,
        { key: 4 },
        [
          vue.createCommentVNode(" 社区页面（嵌入首页，保留底部导航） "),
          vue.createElementVNode("view", { class: "community-page" }, [
            vue.createCommentVNode(" 顶部导航栏 "),
            vue.createElementVNode("view", { class: "community-header" }, [
              vue.createElementVNode("view", {
                class: "community-back-btn",
                onClick: _cache[7] || (_cache[7] = (...args) => $options.goBack && $options.goBack(...args))
              }, [
                vue.createElementVNode("text", { class: "community-back-text" }, "←")
              ]),
              vue.createElementVNode("text", { class: "community-title" }, "宝可梦社区"),
              vue.createElementVNode("view", { style: { "width": "12px" } })
            ]),
            vue.createCommentVNode(" 搜索框 "),
            vue.createElementVNode("view", { class: "community-search-box" }, [
              vue.createElementVNode("view", { class: "community-search-icon" }),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "community-search-input",
                  type: "text",
                  placeholder: "搜索话题...",
                  "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => $data.communitySearch = $event)
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $data.communitySearch]
              ])
            ]),
            vue.createCommentVNode(" 帖子列表 "),
            vue.createElementVNode("scroll-view", {
              class: "community-post-list",
              "scroll-y": ""
            }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($options.filteredCommunityPosts, (post, index) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: post.id,
                    class: "community-post-card"
                  }, [
                    vue.createCommentVNode(" 用户信息 "),
                    vue.createElementVNode("view", { class: "community-user-info" }, [
                      vue.createElementVNode("image", {
                        class: "community-avatar",
                        src: post.avatar,
                        alt: post.username,
                        mode: "cover"
                      }, null, 8, ["src", "alt"]),
                      vue.createElementVNode("view", { class: "community-user-detail" }, [
                        vue.createElementVNode(
                          "text",
                          { class: "community-username" },
                          vue.toDisplayString(post.username),
                          1
                          /* TEXT */
                        ),
                        vue.createElementVNode(
                          "text",
                          { class: "community-post-time" },
                          vue.toDisplayString(post.time),
                          1
                          /* TEXT */
                        )
                      ])
                    ]),
                    vue.createCommentVNode(" 帖子内容 "),
                    vue.createElementVNode("view", { class: "community-post-content" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "community-post-text" },
                        vue.toDisplayString(post.content),
                        1
                        /* TEXT */
                      ),
                      post.image ? (vue.openBlock(), vue.createElementBlock("image", {
                        key: 0,
                        class: "community-post-image",
                        src: post.image,
                        mode: "cover"
                      }, null, 8, ["src"])) : vue.createCommentVNode("v-if", true),
                      post.video ? (vue.openBlock(), vue.createElementBlock("video", {
                        key: 1,
                        class: "community-post-video",
                        src: post.video,
                        controls: ""
                      }, null, 8, ["src"])) : vue.createCommentVNode("v-if", true)
                    ]),
                    vue.createCommentVNode(" 互动按钮 "),
                    vue.createElementVNode("view", { class: "community-action-buttons" }, [
                      vue.createElementVNode("view", {
                        class: "community-action-btn",
                        onClick: ($event) => $options.toggleLike(index)
                      }, [
                        vue.createElementVNode(
                          "text",
                          {
                            class: "community-action-icon",
                            style: vue.normalizeStyle({ color: post.liked ? "#FF5252" : "#999" })
                          },
                          "❤",
                          4
                          /* STYLE */
                        ),
                        vue.createElementVNode(
                          "text",
                          { class: "community-action-count" },
                          vue.toDisplayString(post.likes),
                          1
                          /* TEXT */
                        )
                      ], 8, ["onClick"]),
                      vue.createElementVNode("view", {
                        class: "community-action-btn",
                        onClick: ($event) => $options.showComment(index)
                      }, [
                        vue.createElementVNode("text", { class: "community-action-icon" }, "💬"),
                        vue.createElementVNode(
                          "text",
                          { class: "community-action-count" },
                          vue.toDisplayString(post.comments),
                          1
                          /* TEXT */
                        )
                      ], 8, ["onClick"]),
                      vue.createElementVNode("view", {
                        class: "community-action-btn",
                        onClick: ($event) => $options.toggleFavorite(index)
                      }, [
                        vue.createElementVNode(
                          "text",
                          {
                            class: "community-action-icon",
                            style: vue.normalizeStyle({ color: post.favorited ? "#FFC107" : "#999" })
                          },
                          "★",
                          4
                          /* STYLE */
                        ),
                        vue.createElementVNode(
                          "text",
                          { class: "community-action-count" },
                          vue.toDisplayString(post.favorites),
                          1
                          /* TEXT */
                        )
                      ], 8, ["onClick"])
                    ])
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ]),
            vue.createCommentVNode(" 可移动发帖按钮 "),
            vue.createElementVNode(
              "view",
              {
                class: "community-floating-post-btn",
                style: vue.normalizeStyle({ transform: `translate(${$data.communityBtn.x}px, ${$data.communityBtn.y}px)` }),
                onTouchstart: _cache[9] || (_cache[9] = (...args) => $options.startDrag && $options.startDrag(...args)),
                onTouchmove: _cache[10] || (_cache[10] = vue.withModifiers((...args) => $options.onDrag && $options.onDrag(...args), ["stop", "prevent"])),
                onTouchend: _cache[11] || (_cache[11] = (...args) => $options.endDrag && $options.endDrag(...args)),
                onClick: _cache[12] || (_cache[12] = (...args) => $options.createPost && $options.createPost(...args))
              },
              [
                vue.createElementVNode("image", {
                  class: "community-post-icon",
                  src: _imports_0$1,
                  mode: "aspectFill"
                })
              ],
              36
              /* STYLE, NEED_HYDRATION */
            ),
            vue.createCommentVNode(" 评论模态框 "),
            $data.showCommentModal ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "community-comment-modal"
            }, [
              vue.createElementVNode("view", { class: "community-comment-container" }, [
                vue.createElementVNode("view", { class: "community-comment-header" }, [
                  vue.createElementVNode("text", { class: "community-comment-title" }, "评论"),
                  vue.createElementVNode("text", {
                    class: "community-close-comment",
                    onClick: _cache[13] || (_cache[13] = (...args) => $options.closeCommentModal && $options.closeCommentModal(...args))
                  }, "×")
                ]),
                vue.createElementVNode("scroll-view", {
                  class: "community-comment-list",
                  "scroll-y": ""
                }, [
                  (vue.openBlock(true), vue.createElementBlock(
                    vue.Fragment,
                    null,
                    vue.renderList($data.currentComments, (c, i) => {
                      return vue.openBlock(), vue.createElementBlock("view", {
                        key: i,
                        class: "community-comment-item"
                      }, [
                        vue.createElementVNode("view", null, [
                          vue.createElementVNode(
                            "text",
                            { class: "community-comment-user" },
                            vue.toDisplayString(c.username),
                            1
                            /* TEXT */
                          ),
                          vue.createElementVNode(
                            "text",
                            { class: "community-comment-time" },
                            vue.toDisplayString(c.time),
                            1
                            /* TEXT */
                          )
                        ]),
                        vue.createElementVNode(
                          "view",
                          { class: "community-comment-content" },
                          vue.toDisplayString(c.content),
                          1
                          /* TEXT */
                        )
                      ]);
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  ))
                ]),
                vue.createElementVNode("view", { class: "community-comment-input-area" }, [
                  vue.withDirectives(vue.createElementVNode(
                    "input",
                    {
                      class: "community-comment-input",
                      "onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => $data.commentInput = $event),
                      placeholder: "写下你的评论..."
                    },
                    null,
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vModelText, $data.commentInput]
                  ]),
                  vue.createElementVNode("button", {
                    class: "community-send-comment",
                    onClick: _cache[15] || (_cache[15] = (...args) => $options.sendComment && $options.sendComment(...args))
                  }, "发送")
                ])
              ])
            ])) : vue.createCommentVNode("v-if", true),
            vue.createCommentVNode(" 发帖模态框 "),
            $data.showPostModal ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "community-post-modal"
            }, [
              vue.createElementVNode("view", { class: "community-post-container" }, [
                vue.createElementVNode("view", { class: "community-post-header" }, [
                  vue.createElementVNode("text", { class: "community-post-title" }, "发布新帖子"),
                  vue.createElementVNode("text", {
                    class: "community-close-post",
                    onClick: _cache[16] || (_cache[16] = (...args) => $options.closePostModal && $options.closePostModal(...args))
                  }, "×")
                ]),
                vue.createElementVNode("view", { class: "community-post-input-area" }, [
                  vue.withDirectives(vue.createElementVNode(
                    "textarea",
                    {
                      class: "community-post-textarea",
                      "onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => $data.postTextarea = $event),
                      placeholder: "分享你的宝可梦故事..."
                    },
                    null,
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vModelText, $data.postTextarea]
                  ])
                ]),
                vue.createElementVNode("view", { class: "community-post-actions" }, [
                  vue.createElementVNode("button", {
                    class: "community-cancel-post",
                    onClick: _cache[18] || (_cache[18] = (...args) => $options.closePostModal && $options.closePostModal(...args))
                  }, "取消"),
                  vue.createElementVNode("button", {
                    class: "community-submit-post",
                    onClick: _cache[19] || (_cache[19] = (...args) => $options.submitPost && $options.submitPost(...args))
                  }, "发布")
                ])
              ])
            ])) : vue.createCommentVNode("v-if", true)
          ])
        ],
        2112
        /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
      )) : $data.activePage === "profile" ? (vue.openBlock(), vue.createElementBlock(
        vue.Fragment,
        { key: 5 },
        [
          vue.createCommentVNode(" 我的 - 用户详情视图（嵌入首页，保留底部导航） "),
          vue.createElementVNode("view", { class: "profile-container" }, [
            vue.createElementVNode("view", { class: "user-card" }, [
              vue.createElementVNode("view", { class: "avatar" }, [
                vue.createElementVNode("image", {
                  src: _imports_0,
                  mode: "aspectFit"
                })
              ]),
              vue.createElementVNode(
                "text",
                { class: "username" },
                vue.toDisplayString($data.displayName),
                1
                /* TEXT */
              ),
              vue.createElementVNode("view", { class: "welcome-message" }, "欢迎回来，宝可梦训练师！"),
              vue.createElementVNode("view", {
                class: "logout-button",
                onClick: _cache[20] || (_cache[20] = (...args) => $options.logout && $options.logout(...args))
              }, "退出登录")
            ]),
            vue.createElementVNode("view", { class: "menu" }, [
              vue.createElementVNode("view", {
                class: "menu-item",
                onClick: _cache[21] || (_cache[21] = (...args) => $options.openFavorites && $options.openFavorites(...args))
              }, [
                vue.createElementVNode("view", { class: "menu-icon" }, "⭐"),
                vue.createElementVNode("view", { class: "menu-title" }, "我的收藏"),
                vue.createElementVNode("view", { class: "menu-desc" }, "查看您特别喜欢的宝可梦")
              ]),
              vue.createElementVNode("view", {
                class: "menu-item",
                onClick: _cache[22] || (_cache[22] = (...args) => $options.openTeam && $options.openTeam(...args))
              }, [
                vue.createElementVNode("view", { class: "menu-icon" }, "👥"),
                vue.createElementVNode("view", { class: "menu-title" }, "我的队伍"),
                vue.createElementVNode("view", { class: "menu-desc" }, "管理您的宝可梦战斗队伍")
              ])
            ])
          ])
        ],
        2112
        /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
      )) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 底部导航 "),
      vue.createElementVNode("view", { class: "bottom-nav" }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($data.navItems, (nav) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              key: nav.page,
              class: vue.normalizeClass(["nav-button", { active: $data.activePage === nav.page }]),
              onClick: ($event) => $options.switchPage(nav.page)
            }, [
              vue.createElementVNode("view", { class: "pokeball" }),
              vue.createElementVNode(
                "text",
                null,
                vue.toDisplayString(nav.label),
                1
                /* TEXT */
              )
            ], 10, ["onClick"]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ])
    ]);
  }
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$5], ["__scopeId", "data-v-1cf27b2a"], ["__file", "C:/Users/j/Desktop/宝可梦图鉴 - 副本 (2)/pages/index/index.vue"]]);
  const _sfc_main$5 = {
    data() {
      return {
        displayUrl: "",
        anonKeyHead: "",
        probing: false,
        probeOk: false,
        probeErr: "",
        probeStatus: "",
        lastProbe: ""
      };
    },
    onLoad() {
      this.initDisplay();
    },
    methods: {
      async initDisplay() {
        try {
          const url = "" ? "" : "http://192.168.1.144:8000";
          this.displayUrl = url || "（空）";
          const key = "" ? "" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE";
          this.anonKeyHead = key ? key.slice(0, 12) : "（空）";
          if (!url || !key)
            ;
        } catch (e) {
          this.displayUrl = "（读取失败）";
          this.anonKeyHead = "（读取失败）";
        }
      },
      async probe() {
        this.lastProbe = "pokemons";
        try {
          const resCfg = await new Promise((resolve) => {
            uni.request({ url: "/static/app-config.json", method: "GET", success: resolve, fail: resolve });
          });
          const appCfg = resCfg && resCfg.data ? resCfg.data : {};
          const baseRaw = "" ? "" : "http://192.168.1.144:8000";
          const keyRaw = "" ? "" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE";
          if (baseRaw && keyRaw)
            setSupabaseConfig(String(baseRaw), String(keyRaw));
        } catch (e) {
        }
        this.probing = true;
        this.probeOk = false;
        this.probeErr = "";
        this.probeStatus = "";
        try {
          const resCfg = await new Promise((resolve) => {
            uni.request({ url: "/static/app-config.json", method: "GET", success: resolve, fail: resolve });
          });
          const appCfg = resCfg && resCfg.data ? resCfg.data : {};
          const baseRaw = "" ? "" : "http://192.168.1.144:8000";
          const keyRaw = "" ? "" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE";
          const base = (baseRaw || "").replace(/\/$/, "");
          const url = `${base}/rest/v1/pokemons?select=*&limit=1`;
          const res = await new Promise((resolve, reject) => {
            uni.request({
              url,
              method: "GET",
              header: { apikey: keyRaw, Authorization: `Bearer ${keyRaw}` },
              success: resolve,
              fail: reject
            });
          });
          if (res.statusCode >= 200 && res.statusCode < 300) {
            this.probeOk = true;
            this.probeStatus = String(res.statusCode) + (this.lastProbe ? " [" + this.lastProbe + "]" : "");
          } else {
            this.probeErr = `HTTP ${res.statusCode}: ${JSON.stringify(res.data)}${this.lastProbe ? " [" + this.lastProbe + "]" : ""}`;
          }
        } catch (e) {
          this.probeErr = String(e && e.message ? e.message : e);
        } finally {
          this.probing = false;
        }
      },
      async probeTableBtn(name) {
        try {
          const resCfg = await new Promise((resolve) => {
            uni.request({ url: "/static/app-config.json", method: "GET", success: resolve, fail: resolve });
          });
          const appCfg = resCfg && resCfg.data ? resCfg.data : {};
          const baseRaw = "" ? "" : "http://192.168.1.144:8000";
          const keyRaw = "" ? "" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE";
          if (baseRaw && keyRaw)
            setSupabaseConfig(String(baseRaw), String(keyRaw));
        } catch (e) {
        }
        try {
          this.probing = true;
          this.lastProbe = name;
          this.probeOk = false;
          this.probeErr = "";
          this.probeStatus = "";
          const res = await probeTable(name);
          if (res.ok) {
            this.probeOk = true;
            this.probeStatus = (res.status ? String(res.status) : "200") + " [" + name + "]";
          } else {
            this.probeErr = (res.status ? "HTTP " + res.status + ": " : "") + (res.error || "unknown") + " [" + name + "]";
          }
        } finally {
          this.probing = false;
        }
      }
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { style: { "padding": "16px", "color": "#fff", "background": "#1D3557", "min-height": "100vh" } }, [
      vue.createElementVNode("view", { style: { "margin-bottom": "12px", "font-size": "18px", "font-weight": "bold" } }, "配置自检"),
      vue.createElementVNode("view", { style: { "background": "rgba(255,255,255,0.1)", "padding": "12px", "border-radius": "8px", "margin-bottom": "12px" } }, [
        vue.createElementVNode(
          "view",
          null,
          "Supabase URL: " + vue.toDisplayString($data.displayUrl),
          1
          /* TEXT */
        ),
        vue.createElementVNode(
          "view",
          null,
          "Anon Key 前 12 位: " + vue.toDisplayString($data.anonKeyHead),
          1
          /* TEXT */
        )
      ]),
      vue.createElementVNode("button", {
        onClick: _cache[0] || (_cache[0] = (...args) => $options.probe && $options.probe(...args)),
        style: { "margin-bottom": "12px" }
      }, "运行 REST 探针（pokemons）"),
      vue.createElementVNode("view", { style: { "display": "flex", "gap": "8px", "margin-bottom": "12px" } }, [
        vue.createElementVNode("button", {
          onClick: _cache[1] || (_cache[1] = ($event) => $options.probeTableBtn("pokemons"))
        }, "测 pokemons"),
        vue.createElementVNode("button", {
          onClick: _cache[2] || (_cache[2] = ($event) => $options.probeTableBtn("forms"))
        }, "测 forms"),
        vue.createElementVNode("button", {
          onClick: _cache[3] || (_cache[3] = ($event) => $options.probeTableBtn("images"))
        }, "测 images")
      ]),
      $data.probing ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        style: { "color": "#ccc" }
      }, "探针运行中...")) : $data.probeOk ? (vue.openBlock(), vue.createElementBlock(
        "view",
        {
          key: 1,
          style: { "color": "#9EE493" }
        },
        "探针成功：HTTP " + vue.toDisplayString($data.probeStatus),
        1
        /* TEXT */
      )) : $data.probeErr ? (vue.openBlock(), vue.createElementBlock(
        "view",
        {
          key: 2,
          style: { "color": "#FFD166" }
        },
        "探针失败：" + vue.toDisplayString($data.probeErr),
        1
        /* TEXT */
      )) : vue.createCommentVNode("v-if", true),
      vue.createElementVNode("view", { style: { "margin-top": "16px", "font-size": "12px", "color": "#ddd" } }, "提示：如果 URL/Key 为空或探针失败，请检查 .env、static/app-config.json、网络与 RLS 策略。")
    ]);
  }
  const PagesDebugConfig = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__scopeId", "data-v-9363233c"], ["__file", "C:/Users/j/Desktop/宝可梦图鉴 - 副本 (2)/pages/debug/config.vue"]]);
  function getImageUrl(imageName) {
    if (!imageName)
      return "";
    return `/static/assets/pokemons_image/official/${imageName}`;
  }
  var define_import_meta_env_default$2 = { VITE_SUPABASE_URL: "http://192.168.1.144:8000", VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE", VITE_CJS_IGNORE_WARNING: "true", VITE_ROOT_DIR: "C:/Users/j/Desktop/宝可梦图鉴 - 副本 (2)", VITE_USER_NODE_ENV: "development", BASE_URL: "/", MODE: "development", DEV: true, PROD: false, SSR: false };
  const _sfc_main$4 = {
    data() {
      return {
        loading: true,
        form: {},
        pokemon: {},
        abilities: [],
        activeTab: "基本信息",
        showModal: false,
        dynamicBackground: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        // 优雅的紫蓝渐变加载背景
        // 悬浮操作状态
        likesCount: 0,
        isFavorite: false,
        supabaseUrl: "",
        supabaseKey: ""
      };
    },
    computed: {
      truncatedProfile() {
        if (!this.pokemon.profile)
          return "";
        const profile = this.pokemon.profile;
        if (profile.length <= 100)
          return profile;
        return profile.substring(0, 100) + "...";
      }
    },
    onLoad(options) {
      this.bootstrapEnv();
      if (options.forms_id) {
        this.setLoadingBackground();
        this.loadPokemonData(options.forms_id);
      }
    },
    methods: {
      getImageUrl,
      bootstrapEnv() {
        try {
          const env = typeof { url: _documentCurrentScript && _documentCurrentScript.src || new URL("app-service.js", document.baseURI).href } !== "undefined" && define_import_meta_env_default$2 ? define_import_meta_env_default$2 : {};
          this.supabaseUrl = env && env.VITE_SUPABASE_URL ? String(env.VITE_SUPABASE_URL) : "";
          this.supabaseKey = env && env.VITE_SUPABASE_ANON_KEY ? String(env.VITE_SUPABASE_ANON_KEY) : "";
        } catch (e) {
        }
      },
      goWiki() {
        const idx = this.pokemon && this.pokemon.index;
        if (!idx) {
          uni.showToast({ title: "缺少图鉴编号", icon: "none" });
          return;
        }
        uni.navigateTo({ url: `/pages/wiki/wiki?index=${idx}` });
      },
      async handleLike() {
        if (!this.form || !this.form.forms_id) {
          uni.showToast({ title: "缺少表单ID", icon: "none" });
          return;
        }
        const next = (this.likesCount || 0) + 1;
        this.likesCount = next;
        try {
          const base = (this.supabaseUrl || "").replace(/\/$/, "");
          const key = this.supabaseKey;
          if (!base || !key)
            return;
          const url = `${base}/rest/v1/forms?forms_id=eq.${encodeURIComponent(this.form.forms_id)}`;
          const headers = { "apikey": key, "Authorization": `Bearer ${key}`, "Content-Type": "application/json", "Prefer": "return=minimal" };
          await new Promise((resolve, reject) => {
            uni.request({ url, method: "PATCH", header: headers, data: { likes: next }, timeout: 1e4, success: resolve, fail: reject });
          });
        } catch (e) {
          this.likesCount = Math.max(0, this.likesCount - 1);
          uni.showToast({ title: "点赞失败", icon: "none" });
        }
      },
      async handleToggleFavorite() {
        if (!this.form || !this.form.forms_id) {
          uni.showToast({ title: "缺少表单ID", icon: "none" });
          return;
        }
        const nextFav = !this.isFavorite;
        this.isFavorite = nextFav;
        try {
          const base = (this.supabaseUrl || "").replace(/\/$/, "");
          const key = this.supabaseKey;
          if (!base || !key)
            return;
          const url = `${base}/rest/v1/forms?forms_id=eq.${encodeURIComponent(this.form.forms_id)}`;
          const headers = { "apikey": key, "Authorization": `Bearer ${key}`, "Content-Type": "application/json", "Prefer": "return=minimal" };
          await new Promise((resolve, reject) => {
            uni.request({ url, method: "PATCH", header: headers, data: { favorite: nextFav }, timeout: 1e4, success: resolve, fail: reject });
          });
          uni.showToast({ title: nextFav ? "收藏成功" : "已取消收藏", icon: "none" });
        } catch (e) {
          this.isFavorite = !nextFav;
          uni.showToast({ title: "收藏操作失败", icon: "none" });
        }
      },
      async loadPokemonData(formsId) {
        this.loading = true;
        try {
          const result = await fetchPokemonDetailOptimized(formsId);
          this.form = result.form;
          this.pokemon = result.pokemon;
          this.abilities = result.abilities;
          this.likesCount = Number(result.form && result.form.likes) || 0;
          this.isFavorite = !!(result.form && result.form.favorite);
          this.setBackgroundColor(result.form.color);
        } catch (error) {
          formatAppLog("error", "at pages/detail/detail.vue:220", "Failed to load pokemon details:", error);
          uni.showToast({
            title: "加载宝可梦信息失败",
            icon: "none"
          });
        } finally {
          this.loading = false;
        }
      },
      switchTab(tabName) {
        this.activeTab = tabName;
      },
      getColorValue(colorName) {
        const colorMap = {
          "红色": "#F44336",
          // 标准红色
          "蓝色": "#2196F3",
          // 标准蓝色
          "绿色": "#4CAF50",
          // 标准绿色（修复之前的淡蓝色问题）
          "黄色": "#FFEB3B",
          // 标准黄色
          "紫色": "#9C27B0",
          // 标准紫色
          "粉红色": "#E91E63",
          // 粉红色（数据库中的实际值）
          "黑色": "#424242",
          // 柔和黑色
          "白色": "#FAFAFA",
          // 柔和白色
          "灰色": "#9E9E9E",
          // 标准灰色
          "褐色": "#8D6E63",
          // 褐色（数据库中的实际值）
          "未知色": "#BDC3C7"
          // 未知颜色的默认值
        };
        return colorMap[colorName] || "#BDC3C7";
      },
      showFullDescription() {
        if (this.pokemon.profile && this.pokemon.profile.length > 100) {
          this.showModal = true;
        }
      },
      closeModal() {
        this.showModal = false;
      },
      setBackgroundColor(colorName) {
        const baseColor = this.getColorValue(colorName);
        const lightColor = this.lightenColor(baseColor, 0.3);
        const darkColor = this.darkenColor(baseColor, 0.1);
        this.dynamicBackground = `linear-gradient(135deg, ${lightColor} 0%, ${baseColor} 50%, ${darkColor} 100%)`;
      },
      lightenColor(color, amount) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(255 * amount);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 255) + amt;
        const B = (num & 255) + amt;
        return "#" + (16777216 + (R < 255 ? R < 1 ? 0 : R : 255) * 65536 + (G < 255 ? G < 1 ? 0 : G : 255) * 256 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
      },
      darkenColor(color, amount) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(255 * amount);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 255) - amt;
        const B = (num & 255) - amt;
        return "#" + (16777216 + (R > 255 ? 255 : R < 0 ? 0 : R) * 65536 + (G > 255 ? 255 : G < 0 ? 0 : G) * 256 + (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
      },
      setLoadingBackground() {
        const loadingBackgrounds = [
          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          // 紫蓝渐变
          "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          // 粉红渐变
          "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          // 蓝青渐变
          "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
          // 绿青渐变
          "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
          // 粉黄渐变
          "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
          // 淡青粉渐变
          "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"
          // 淡粉渐变
        ];
        const randomIndex = Math.floor(Math.random() * loadingBackgrounds.length);
        this.dynamicBackground = loadingBackgrounds[randomIndex];
      }
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "div",
      {
        class: "phone-container",
        style: vue.normalizeStyle({ background: $data.dynamicBackground })
      },
      [
        vue.createCommentVNode(" 加载骨架屏 "),
        $data.loading ? (vue.openBlock(), vue.createElementBlock("div", {
          key: 0,
          class: "loading-skeleton white-content"
        }, [
          vue.createElementVNode("div", { class: "skeleton-image" }),
          vue.createElementVNode("div", { class: "skeleton-title" }),
          vue.createElementVNode("div", { class: "skeleton-subtitle" }),
          vue.createElementVNode("div", { class: "skeleton-tags" }, [
            vue.createElementVNode("div", { class: "skeleton-tag" }),
            vue.createElementVNode("div", { class: "skeleton-tag" })
          ]),
          vue.createElementVNode("div", { class: "skeleton-description" }),
          vue.createElementVNode("div", { class: "skeleton-details" }, [
            vue.createElementVNode("div", { class: "skeleton-detail-item" }),
            vue.createElementVNode("div", { class: "skeleton-detail-item" }),
            vue.createElementVNode("div", { class: "skeleton-detail-item" }),
            vue.createElementVNode("div", { class: "skeleton-detail-item" })
          ])
        ])) : vue.createCommentVNode("v-if", true),
        !$data.loading ? (vue.openBlock(), vue.createElementBlock("div", {
          key: 1,
          class: "pokemon-container white-content"
        }, [
          vue.createCommentVNode(" 图鉴编号 "),
          vue.createElementVNode(
            "div",
            { class: "pokemon-number" },
            "#" + vue.toDisplayString($data.pokemon.index ? String($data.pokemon.index).padStart(4, "0") : $data.form.pokemon_id ? String($data.form.pokemon_id).padStart(4, "0") : ""),
            1
            /* TEXT */
          ),
          vue.createElementVNode("div", { class: "pokemon-image" }, [
            vue.createElementVNode("image", {
              src: $options.getImageUrl($data.form.image),
              mode: "aspectFit",
              style: { "width": "150px", "height": "150px" }
            }, null, 8, ["src"])
          ]),
          vue.createElementVNode(
            "h1",
            { class: "pokemon-name" },
            vue.toDisplayString($data.pokemon.name),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "div",
            { class: "japanese-name" },
            vue.toDisplayString($data.pokemon.name_jp) + "・" + vue.toDisplayString($data.pokemon.name_en),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "div",
            { class: "pokemon-category" },
            vue.toDisplayString($data.form.genus || "未知宝可梦"),
            1
            /* TEXT */
          ),
          vue.createElementVNode("div", { class: "attributes" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($data.form.typesZh, (t, index) => {
                return vue.openBlock(), vue.createElementBlock(
                  "div",
                  {
                    key: t,
                    class: vue.normalizeClass(["attribute", $data.form.typesEn[index]])
                  },
                  vue.toDisplayString(t),
                  3
                  /* TEXT, CLASS */
                );
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          vue.createElementVNode("div", { class: "egg-groups" }, [
            vue.createElementVNode("div", { class: "egg-group" }, "怪兽群"),
            vue.createElementVNode("div", { class: "egg-group" }, "植物群")
          ]),
          vue.createElementVNode("div", {
            class: "pokemon-description",
            onClick: _cache[0] || (_cache[0] = (...args) => $options.showFullDescription && $options.showFullDescription(...args))
          }, [
            vue.createElementVNode(
              "p",
              null,
              vue.toDisplayString($options.truncatedProfile),
              1
              /* TEXT */
            ),
            $data.pokemon.profile && $data.pokemon.profile.length > 100 ? (vue.openBlock(), vue.createElementBlock("span", {
              key: 0,
              class: "read-more"
            }, "点击查看完整介绍 >")) : vue.createCommentVNode("v-if", true)
          ]),
          vue.createCommentVNode(" 完整介绍模态框 "),
          $data.showModal ? (vue.openBlock(), vue.createElementBlock("div", {
            key: 0,
            class: "modal-overlay",
            onClick: _cache[3] || (_cache[3] = (...args) => $options.closeModal && $options.closeModal(...args))
          }, [
            vue.createElementVNode("div", {
              class: "modal-content",
              onClick: _cache[2] || (_cache[2] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("div", { class: "modal-header" }, [
                vue.createElementVNode(
                  "h3",
                  null,
                  vue.toDisplayString($data.pokemon.name) + " - 详细介绍",
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("button", {
                  class: "close-btn",
                  onClick: _cache[1] || (_cache[1] = (...args) => $options.closeModal && $options.closeModal(...args))
                }, "×")
              ]),
              vue.createElementVNode("div", { class: "modal-body" }, [
                vue.createElementVNode(
                  "p",
                  null,
                  vue.toDisplayString($data.pokemon.profile),
                  1
                  /* TEXT */
                )
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("div", { class: "pokemon-details" }, [
            vue.createElementVNode("div", { class: "detail-item" }, [
              vue.createElementVNode("span", { class: "detail-label" }, "身高"),
              vue.createElementVNode(
                "span",
                { class: "detail-value" },
                vue.toDisplayString($data.form.height || "N/A"),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("div", { class: "detail-item" }, [
              vue.createElementVNode("span", { class: "detail-label" }, "体重"),
              vue.createElementVNode(
                "span",
                { class: "detail-value" },
                vue.toDisplayString($data.form.weight || "N/A"),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("div", { class: "detail-item" }, [
              vue.createElementVNode("span", { class: "detail-label" }, "体形"),
              vue.createElementVNode(
                "span",
                { class: "detail-value" },
                vue.toDisplayString($data.form.shape || "未知"),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("div", { class: "detail-item" }, [
              vue.createElementVNode("span", { class: "detail-label" }, "颜色"),
              vue.createElementVNode("span", { class: "detail-value" }, [
                vue.createElementVNode(
                  "span",
                  {
                    class: "color-indicator",
                    style: vue.normalizeStyle({ backgroundColor: $options.getColorValue($data.form.color) })
                  },
                  null,
                  4
                  /* STYLE */
                ),
                vue.createTextVNode(
                  " " + vue.toDisplayString($data.form.color || "未知"),
                  1
                  /* TEXT */
                )
              ])
            ])
          ]),
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($data.abilities, (ability) => {
              return vue.openBlock(), vue.createElementBlock("div", {
                class: "ability",
                key: ability.name
              }, [
                vue.createElementVNode("div", { class: "ability-title" }, [
                  vue.createTextVNode(
                    vue.toDisplayString(ability.name) + " ",
                    1
                    /* TEXT */
                  ),
                  ability.is_hidden ? (vue.openBlock(), vue.createElementBlock("span", {
                    key: 0,
                    style: { "font-size": "12px", "color": "#e67e22" }
                  }, "(隐藏特性)")) : vue.createCommentVNode("v-if", true)
                ]),
                vue.createElementVNode(
                  "p",
                  { class: "ability-description" },
                  vue.toDisplayString(ability.description),
                  1
                  /* TEXT */
                )
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          )),
          vue.createElementVNode("view", {
            class: "wiki-button",
            onClick: _cache[4] || (_cache[4] = (...args) => $options.goWiki && $options.goWiki(...args))
          }, "查看神奇宝贝百科介绍")
        ])) : vue.createCommentVNode("v-if", true),
        vue.createCommentVNode(" 悬浮操作组件：点赞与收藏 "),
        vue.createElementVNode("div", { class: "floating-actions" }, [
          vue.createElementVNode("div", {
            class: "float-btn like",
            onClick: _cache[5] || (_cache[5] = (...args) => $options.handleLike && $options.handleLike(...args))
          }, [
            vue.createElementVNode("span", { class: "icon" }, "👍"),
            vue.createElementVNode(
              "span",
              { class: "count" },
              vue.toDisplayString($data.likesCount),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode(
            "div",
            {
              class: vue.normalizeClass(["float-btn favorite", { active: $data.isFavorite }]),
              onClick: _cache[6] || (_cache[6] = (...args) => $options.handleToggleFavorite && $options.handleToggleFavorite(...args))
            },
            [
              vue.createElementVNode("span", { class: "icon" }, "★")
            ],
            2
            /* CLASS */
          )
        ]),
        vue.createElementVNode("div", { class: "navigation" }, [
          vue.createElementVNode("div", { class: "nav-item active" }, "基本信息"),
          vue.createElementVNode("div", { class: "nav-item" }, "技能招式"),
          vue.createElementVNode("div", { class: "nav-item" }, "获得方式"),
          vue.createElementVNode("div", { class: "nav-item" }, "配招培育"),
          vue.createElementVNode("div", { class: "nav-item" }, "相关")
        ])
      ],
      4
      /* STYLE */
    );
  }
  const PagesDetailDetail = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__file", "C:/Users/j/Desktop/宝可梦图鉴 - 副本 (2)/pages/detail/detail.vue"]]);
  var define_import_meta_env_default$1 = { VITE_SUPABASE_URL: "http://192.168.1.144:8000", VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE", VITE_CJS_IGNORE_WARNING: "true", VITE_ROOT_DIR: "C:/Users/j/Desktop/宝可梦图鉴 - 副本 (2)", VITE_USER_NODE_ENV: "development", BASE_URL: "/", MODE: "development", DEV: true, PROD: false, SSR: false };
  const _sfc_main$3 = {
    data() {
      return {
        isLogin: true,
        showPassword: false,
        showConfirmPassword: false,
        imageLoaded: false,
        supabaseUrl: "",
        supabaseKey: "",
        loginForm: {
          usernameOrEmail: "",
          password: ""
        },
        registerForm: {
          username: "",
          email: "",
          password: "",
          confirmPassword: ""
        }
      };
    },
    onLoad() {
      this.bootstrapEnv();
      try {
        const u = uni.getStorageSync("user");
        if (u && u.name) {
          uni.reLaunch({ url: "/pages/index/index?page=profile" });
        }
      } catch (e) {
      }
    },
    methods: {
      bootstrapEnv() {
        try {
          const env = typeof { url: _documentCurrentScript && _documentCurrentScript.src || new URL("app-service.js", document.baseURI).href } !== "undefined" && define_import_meta_env_default$1 ? define_import_meta_env_default$1 : {};
          this.supabaseUrl = env && env.VITE_SUPABASE_URL ? String(env.VITE_SUPABASE_URL) : "";
          this.supabaseKey = env && env.VITE_SUPABASE_ANON_KEY ? String(env.VITE_SUPABASE_ANON_KEY) : "";
        } catch (e) {
        }
        if ((!this.supabaseUrl || !this.supabaseKey) && typeof uni !== "undefined") {
          try {
            uni.request({
              url: "/static/app-config.json",
              method: "GET",
              success: (res) => {
                const cfg = res && res.data ? res.data : null;
                if (cfg && cfg.supabaseUrl && cfg.supabaseAnonKey) {
                  this.supabaseUrl = String(cfg.supabaseUrl);
                  this.supabaseKey = String(cfg.supabaseAnonKey).replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\r?\n/g, "").trim();
                }
              }
            });
          } catch (e) {
          }
        }
      },
      goBack() {
        uni.switchTab({
          url: "/pages/index/index"
        });
      },
      switchToLogin() {
        this.isLogin = true;
      },
      switchToRegister() {
        this.isLogin = false;
      },
      togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
      },
      toggleConfirmPasswordVisibility() {
        this.showConfirmPassword = !this.showConfirmPassword;
      },
      handleLogin: async function() {
        const { usernameOrEmail, password } = this.loginForm;
        const name = (usernameOrEmail || "").trim();
        if (!name || !password) {
          uni.showToast({ title: "请输入用户名和密码", icon: "none" });
          return;
        }
        try {
          await new Promise((resolve) => {
            this.bootstrapEnv();
            setTimeout(resolve, 0);
          });
          const base = (this.supabaseUrl || "").replace(/\/$/, "");
          const key = this.supabaseKey;
          if (!base || !key) {
            uni.showToast({ title: "后端配置缺失", icon: "none" });
            return;
          }
          const url = `${base}/rest/v1/Users?select="UID",name&name=eq.${encodeURIComponent(name)}&password=eq.${encodeURIComponent(password)}&limit=1`;
          const headers = { "apikey": key, "Authorization": `Bearer ${key}`, "Accept": "application/json" };
          const res = await new Promise((resolve, reject) => {
            uni.request({ url, method: "GET", header: headers, timeout: 12e3, success: resolve, fail: reject });
          });
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const rows = Array.isArray(res.data) ? res.data : [];
            if (rows.length === 1) {
              try {
                uni.setStorageSync("user", { uid: rows[0].UID, name: rows[0].name });
              } catch (_) {
              }
              uni.showToast({ title: "登录成功", icon: "none" });
              setTimeout(() => {
                uni.reLaunch({ url: "/pages/index/index?page=profile" });
              }, 300);
            } else {
              uni.showToast({ title: "用户名或密码错误", icon: "none" });
            }
          } else {
            uni.showToast({ title: "登录失败: HTTP " + res.statusCode, icon: "none" });
          }
        } catch (e) {
          uni.showToast({ title: "网络异常: " + (e.errMsg || e.message || e), icon: "none" });
        }
      },
      handleRegister: async function() {
        const { username, password, confirmPassword } = this.registerForm;
        if (!username || !password || !confirmPassword) {
          uni.showToast({ title: "请填写完整信息", icon: "none" });
          return;
        }
        if (password !== confirmPassword) {
          uni.showToast({ title: "两次密码不一致", icon: "none" });
          return;
        }
        try {
          await new Promise((resolve) => {
            this.bootstrapEnv();
            setTimeout(resolve, 0);
          });
          const base = (this.supabaseUrl || "").replace(/\/$/, "");
          const key = this.supabaseKey;
          if (!base || !key) {
            uni.showToast({ title: "后端配置缺失", icon: "none" });
            return;
          }
          const headers = { "apikey": key, "Authorization": `Bearer ${key}`, "Accept": "application/json" };
          const checkUrl = `${base}/rest/v1/Users?select=name&name=eq.${encodeURIComponent(username)}&limit=1`;
          const checkRes = await new Promise((resolve, reject) => {
            uni.request({ url: checkUrl, method: "GET", header: headers, timeout: 1e4, success: resolve, fail: reject });
          });
          if (checkRes.statusCode >= 200 && checkRes.statusCode < 300) {
            const exists = Array.isArray(checkRes.data) && checkRes.data.length > 0;
            if (exists) {
              uni.showToast({ title: "用户名已存在", icon: "none" });
              return;
            }
          } else {
            uni.showToast({ title: "重名检查失败: HTTP " + checkRes.statusCode, icon: "none" });
            return;
          }
          const createUrl = `${base}/rest/v1/Users`;
          const createHeaders = { ...headers, "Content-Type": "application/json", "Prefer": "return=representation" };
          const body = { name: username, password, created_time: (/* @__PURE__ */ new Date()).toISOString() };
          const res = await new Promise((resolve, reject) => {
            uni.request({ url: createUrl, method: "POST", header: createHeaders, data: body, timeout: 12e3, success: resolve, fail: reject });
          });
          if (res.statusCode >= 200 && res.statusCode < 300) {
            uni.showToast({ title: "注册成功", icon: "none" });
            setTimeout(() => {
              uni.reLaunch({ url: "/pages/index/index?page=profile" });
            }, 500);
          } else {
            const msg = res.data && res.data.message ? res.data.message : "HTTP " + res.statusCode;
            uni.showToast({ title: "注册失败: " + msg, icon: "none" });
          }
        } catch (e) {
          uni.showToast({ title: "网络异常: " + (e.errMsg || e.message || e), icon: "none" });
        }
      },
      forgotPassword() {
        uni.showToast({
          title: "忘记密码功能开发中...",
          icon: "none"
        });
      },
      onImageLoad() {
        this.imageLoaded = true;
        formatAppLog("log", "at pages/login/index.vue:292", "背景图片加载完成");
      },
      onImageError(e) {
        formatAppLog("error", "at pages/login/index.vue:295", "背景图片加载失败:", e);
        uni.showToast({
          title: "背景图片加载失败",
          icon: "none"
        });
      }
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "login-container" }, [
      vue.createCommentVNode(" 状态栏 "),
      vue.createElementVNode("view", { class: "status-bar" }, [
        vue.createElementVNode("view", { class: "icons" }, [
          vue.createElementVNode("view", { class: "icon" }),
          vue.createElementVNode("view", { class: "icon" })
        ])
      ]),
      vue.createCommentVNode(" 顶部导航栏 "),
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("view", {
          class: "back-btn",
          onClick: _cache[0] || (_cache[0] = (...args) => $options.goBack && $options.goBack(...args))
        }, [
          vue.createElementVNode("text", { class: "back-text" }, "←")
        ]),
        vue.createElementVNode("text", { class: "title" }, "登录注册"),
        vue.createElementVNode("view", { style: { "width": "24rpx" } })
      ]),
      vue.createCommentVNode(" 背景层 "),
      vue.createElementVNode("view", { class: "background-layer" }, [
        vue.createElementVNode(
          "image",
          {
            class: "background-image",
            src: _imports_0,
            mode: "aspectFill",
            "lazy-load": "false",
            "show-menu-by-longpress": false,
            onLoad: _cache[1] || (_cache[1] = (...args) => $options.onImageLoad && $options.onImageLoad(...args)),
            onError: _cache[2] || (_cache[2] = (...args) => $options.onImageError && $options.onImageError(...args))
          },
          null,
          32
          /* NEED_HYDRATION */
        ),
        vue.createElementVNode("view", { class: "overlay" }),
        vue.createCommentVNode(" 加载指示器 "),
        !$data.imageLoaded ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "loading-indicator"
        }, [
          vue.createElementVNode("text", { class: "loading-text" }, "加载中...")
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createCommentVNode(" 内容层 "),
      vue.createElementVNode("view", { class: "content-layer" }, [
        vue.createCommentVNode(" 页面标题 "),
        vue.createElementVNode("view", { class: "page-title" }, [
          vue.createElementVNode("text", { class: "main-title" }, "宝可梦训练家"),
          vue.createElementVNode("text", { class: "sub-title" }, "开启你的宝可梦冒险之旅")
        ]),
        vue.createCommentVNode(" 切换标签栏 "),
        vue.createElementVNode("view", { class: "tabs" }, [
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["tab", { active: $data.isLogin }]),
              onClick: _cache[3] || (_cache[3] = (...args) => $options.switchToLogin && $options.switchToLogin(...args))
            },
            [
              vue.createElementVNode("text", { class: "tab-text" }, "登录")
            ],
            2
            /* CLASS */
          ),
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["tab", { active: !$data.isLogin }]),
              onClick: _cache[4] || (_cache[4] = (...args) => $options.switchToRegister && $options.switchToRegister(...args))
            },
            [
              vue.createElementVNode("text", { class: "tab-text" }, "注册")
            ],
            2
            /* CLASS */
          )
        ]),
        vue.createCommentVNode(" 表单区域 "),
        vue.createElementVNode("view", { class: "form-container" }, [
          vue.createCommentVNode(" 登录表单 "),
          $data.isLogin ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "login-form"
          }, [
            vue.createElementVNode("view", { class: "input-group" }, [
              vue.createElementVNode("view", { class: "input-icon" }, "👤"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "input-field",
                  placeholder: "请输入用户名或邮箱",
                  "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $data.loginForm.usernameOrEmail = $event)
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $data.loginForm.usernameOrEmail]
              ])
            ]),
            vue.createElementVNode("view", { class: "input-group" }, [
              vue.createElementVNode("view", { class: "input-icon" }, "🔒"),
              vue.withDirectives(vue.createElementVNode("input", {
                class: "input-field",
                type: $data.showPassword ? "text" : "password",
                placeholder: "请输入密码",
                "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $data.loginForm.password = $event)
              }, null, 8, ["type"]), [
                [vue.vModelDynamic, $data.loginForm.password]
              ]),
              vue.createElementVNode("view", {
                class: "eye-icon",
                onClick: _cache[7] || (_cache[7] = (...args) => $options.togglePasswordVisibility && $options.togglePasswordVisibility(...args))
              }, [
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString($data.showPassword ? "👁️" : "👁️‍🗨️"),
                  1
                  /* TEXT */
                )
              ])
            ]),
            vue.createElementVNode("button", {
              class: "submit-btn",
              onClick: _cache[8] || (_cache[8] = (...args) => $options.handleLogin && $options.handleLogin(...args))
            }, "登录"),
            vue.createElementVNode("view", { class: "footer-links" }, [
              vue.createElementVNode("text", {
                class: "link",
                onClick: _cache[9] || (_cache[9] = (...args) => $options.forgotPassword && $options.forgotPassword(...args))
              }, "忘记密码？")
            ])
          ])) : (vue.openBlock(), vue.createElementBlock(
            vue.Fragment,
            { key: 1 },
            [
              vue.createCommentVNode(" 注册表单 "),
              vue.createElementVNode("view", { class: "register-form" }, [
                vue.createElementVNode("view", { class: "input-group" }, [
                  vue.createElementVNode("view", { class: "input-icon" }, "👤"),
                  vue.withDirectives(vue.createElementVNode(
                    "input",
                    {
                      class: "input-field",
                      placeholder: "请输入用户名",
                      "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => $data.registerForm.username = $event)
                    },
                    null,
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vModelText, $data.registerForm.username]
                  ])
                ]),
                vue.createElementVNode("view", { class: "input-group" }, [
                  vue.createElementVNode("view", { class: "input-icon" }, "📧"),
                  vue.withDirectives(vue.createElementVNode(
                    "input",
                    {
                      class: "input-field",
                      placeholder: "请输入邮箱",
                      "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => $data.registerForm.email = $event)
                    },
                    null,
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vModelText, $data.registerForm.email]
                  ])
                ]),
                vue.createElementVNode("view", { class: "input-group" }, [
                  vue.createElementVNode("view", { class: "input-icon" }, "🔒"),
                  vue.withDirectives(vue.createElementVNode("input", {
                    class: "input-field",
                    type: $data.showPassword ? "text" : "password",
                    placeholder: "请输入密码",
                    "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => $data.registerForm.password = $event)
                  }, null, 8, ["type"]), [
                    [vue.vModelDynamic, $data.registerForm.password]
                  ]),
                  vue.createElementVNode("view", {
                    class: "eye-icon",
                    onClick: _cache[13] || (_cache[13] = (...args) => $options.togglePasswordVisibility && $options.togglePasswordVisibility(...args))
                  }, [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString($data.showPassword ? "👁️" : "👁️‍🗨️"),
                      1
                      /* TEXT */
                    )
                  ])
                ]),
                vue.createElementVNode("view", { class: "input-group" }, [
                  vue.createElementVNode("view", { class: "input-icon" }, "🔒"),
                  vue.withDirectives(vue.createElementVNode("input", {
                    class: "input-field",
                    type: $data.showConfirmPassword ? "text" : "password",
                    placeholder: "请确认密码",
                    "onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => $data.registerForm.confirmPassword = $event)
                  }, null, 8, ["type"]), [
                    [vue.vModelDynamic, $data.registerForm.confirmPassword]
                  ]),
                  vue.createElementVNode("view", {
                    class: "eye-icon",
                    onClick: _cache[15] || (_cache[15] = (...args) => $options.toggleConfirmPasswordVisibility && $options.toggleConfirmPasswordVisibility(...args))
                  }, [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString($data.showConfirmPassword ? "👁️" : "👁️‍🗨️"),
                      1
                      /* TEXT */
                    )
                  ])
                ]),
                vue.createElementVNode("button", {
                  class: "submit-btn",
                  onClick: _cache[16] || (_cache[16] = (...args) => $options.handleRegister && $options.handleRegister(...args))
                }, "注册"),
                vue.createElementVNode("view", { class: "footer-links" }, [
                  vue.createElementVNode("text", {
                    class: "link switch-link",
                    onClick: _cache[17] || (_cache[17] = (...args) => $options.switchToLogin && $options.switchToLogin(...args))
                  }, "切换到登录")
                ])
              ])
            ],
            2112
            /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
          ))
        ])
      ])
    ]);
  }
  const PagesLoginIndex = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__file", "C:/Users/j/Desktop/宝可梦图鉴 - 副本 (2)/pages/login/index.vue"]]);
  const _sfc_main$2 = {
    data() {
      return {
        postTitle: "",
        postContent: "",
        postTags: "",
        selectedImage: "",
        selectedVideo: "",
        toastMsg: "",
        loading: false
      };
    },
    methods: {
      goBack() {
        uni.showModal({
          title: "提示",
          content: "确定要放弃编辑吗？未保存的内容将会丢失。",
          success: (res) => {
            if (res.confirm)
              uni.navigateBack();
          }
        });
      },
      updateCounts() {
      },
      pickImage() {
        const that = this;
        uni.chooseImage({
          count: 1,
          success(res) {
            const path = res.tempFilePaths && res.tempFilePaths[0] || "";
            that.selectedImage = path;
            if (that.selectedVideo)
              that.removeVideo();
          }
        });
      },
      pickVideo() {
        const that = this;
        uni.chooseVideo({
          success(res) {
            const path = res.tempFilePath || "";
            that.selectedVideo = path;
            if (that.selectedImage)
              that.removeImage();
          }
        });
      },
      removeImage() {
        this.selectedImage = "";
      },
      removeVideo() {
        this.selectedVideo = "";
      },
      showToast(message, duration = 2e3) {
        this.toastMsg = message;
        setTimeout(() => {
          this.toastMsg = "";
        }, duration);
      },
      publishPost() {
        const title = (this.postTitle || "").trim();
        const content = (this.postContent || "").trim();
        (this.postTags || "").trim();
        if (!title) {
          this.showToast("请输入标题");
          return;
        }
        if (!content) {
          this.showToast("请输入正文内容");
          return;
        }
        this.loading = true;
        setTimeout(() => {
          this.loading = false;
          this.showToast("发布成功", 1500);
          const newPost = {
            id: Date.now(),
            avatar: "https://ai-public.mastergo.com/ai/img_res/a80f1e0b5ba3d38b3dccce7abc7d0323.jpg",
            username: "当前用户",
            time: "刚刚",
            content,
            image: this.selectedImage,
            video: this.selectedVideo,
            likes: 0,
            liked: false,
            comments: 0,
            favorites: 0,
            favorited: false,
            commentList: []
          };
          try {
            uni.setStorageSync("newPost", newPost);
          } catch (e) {
          }
          setTimeout(() => {
            uni.navigateBack();
          }, 800);
        }, 1200);
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 顶部导航栏 "),
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("view", {
          class: "back-btn",
          onClick: _cache[0] || (_cache[0] = (...args) => $options.goBack && $options.goBack(...args))
        }, [
          vue.createElementVNode("text", { class: "back-text" }, "←")
        ]),
        vue.createElementVNode("text", { class: "title" }, "发布帖子"),
        vue.createElementVNode("view", {
          class: "publish-btn",
          onClick: _cache[1] || (_cache[1] = (...args) => $options.publishPost && $options.publishPost(...args))
        }, [
          vue.createElementVNode("text", { class: "publish-text" }, "发布")
        ])
      ]),
      vue.createCommentVNode(" 帖子编辑区域 "),
      vue.createElementVNode("scroll-view", {
        class: "edit-section",
        "scroll-y": ""
      }, [
        vue.createCommentVNode(" 标题输入框 "),
        vue.createElementVNode("view", { class: "input-group" }, [
          vue.createElementVNode("text", { class: "input-label" }, "标题"),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              class: "title-input",
              "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.postTitle = $event),
              placeholder: "请输入你的标题",
              maxlength: "50",
              onInput: _cache[3] || (_cache[3] = (...args) => $options.updateCounts && $options.updateCounts(...args))
            },
            null,
            544
            /* NEED_HYDRATION, NEED_PATCH */
          ), [
            [vue.vModelText, $data.postTitle]
          ]),
          vue.createElementVNode(
            "text",
            { class: "char-count" },
            vue.toDisplayString($data.postTitle.length) + "/50",
            1
            /* TEXT */
          )
        ]),
        vue.createCommentVNode(" 正文输入框 "),
        vue.createElementVNode("view", { class: "input-group" }, [
          vue.createElementVNode("text", { class: "input-label" }, "正文"),
          vue.withDirectives(vue.createElementVNode(
            "textarea",
            {
              class: "content-textarea",
              "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.postContent = $event),
              placeholder: "请输入你的正文",
              maxlength: "10000",
              onInput: _cache[5] || (_cache[5] = (...args) => $options.updateCounts && $options.updateCounts(...args))
            },
            null,
            544
            /* NEED_HYDRATION, NEED_PATCH */
          ), [
            [vue.vModelText, $data.postContent]
          ]),
          vue.createElementVNode(
            "text",
            { class: "char-count" },
            vue.toDisplayString($data.postContent.length) + "/10000",
            1
            /* TEXT */
          )
        ]),
        vue.createCommentVNode(" 媒体上传区域 "),
        vue.createElementVNode("view", { class: "media-section" }, [
          vue.createElementVNode("text", { class: "section-title" }, "添加图片或视频"),
          vue.createElementVNode("view", { class: "media-buttons" }, [
            vue.createElementVNode("view", {
              class: "media-btn",
              onClick: _cache[6] || (_cache[6] = (...args) => $options.pickImage && $options.pickImage(...args))
            }, [
              vue.createElementVNode("text", { class: "media-icon" }, "📷"),
              vue.createElementVNode("text", { class: "media-text" }, "添加图片")
            ]),
            vue.createElementVNode("view", {
              class: "media-btn",
              onClick: _cache[7] || (_cache[7] = (...args) => $options.pickVideo && $options.pickVideo(...args))
            }, [
              vue.createElementVNode("text", { class: "media-icon" }, "🎥"),
              vue.createElementVNode("text", { class: "media-text" }, "添加视频")
            ])
          ]),
          vue.createCommentVNode(" 预览区域 "),
          $data.selectedImage ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "preview-section"
          }, [
            vue.createElementVNode("text", { class: "preview-title" }, "图片预览"),
            vue.createElementVNode("image", {
              class: "preview-image",
              src: $data.selectedImage,
              mode: "aspectFit"
            }, null, 8, ["src"]),
            vue.createElementVNode("view", { class: "preview-actions" }, [
              vue.createElementVNode("text", {
                class: "action-btn",
                onClick: _cache[8] || (_cache[8] = (...args) => $options.removeImage && $options.removeImage(...args))
              }, "删除图片")
            ])
          ])) : vue.createCommentVNode("v-if", true),
          $data.selectedVideo ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "preview-section"
          }, [
            vue.createElementVNode("text", { class: "preview-title" }, "视频预览"),
            vue.createElementVNode("video", {
              class: "preview-video",
              src: $data.selectedVideo,
              controls: ""
            }, null, 8, ["src"]),
            vue.createElementVNode("view", { class: "preview-actions" }, [
              vue.createElementVNode("text", {
                class: "action-btn",
                onClick: _cache[9] || (_cache[9] = (...args) => $options.removeVideo && $options.removeVideo(...args))
              }, "删除视频")
            ])
          ])) : vue.createCommentVNode("v-if", true)
        ]),
        vue.createCommentVNode(" 标签输入框 "),
        vue.createElementVNode("view", { class: "input-group" }, [
          vue.createElementVNode("text", { class: "input-label" }, "标签"),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              class: "tag-input",
              "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => $data.postTags = $event),
              placeholder: "请输入标签（多个标签用逗号分隔）",
              maxlength: "100",
              onInput: _cache[11] || (_cache[11] = (...args) => $options.updateCounts && $options.updateCounts(...args))
            },
            null,
            544
            /* NEED_HYDRATION, NEED_PATCH */
          ), [
            [vue.vModelText, $data.postTags]
          ]),
          vue.createElementVNode(
            "text",
            { class: "char-count" },
            vue.toDisplayString($data.postTags.length) + "/100",
            1
            /* TEXT */
          )
        ])
      ]),
      vue.createCommentVNode(" 提示框 "),
      $data.toastMsg ? (vue.openBlock(), vue.createElementBlock(
        "view",
        {
          key: 0,
          class: "toast"
        },
        vue.toDisplayString($data.toastMsg),
        1
        /* TEXT */
      )) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 加载中 "),
      $data.loading ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "loading"
      }, [
        vue.createElementVNode("view", { class: "loading-content" }, [
          vue.createElementVNode("view", { class: "spinner" }),
          vue.createElementVNode("text", null, "发布中...")
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesCommunityCreate = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__scopeId", "data-v-a2e5626f"], ["__file", "C:/Users/j/Desktop/宝可梦图鉴 - 副本 (2)/pages/community/create.vue"]]);
  var define_import_meta_env_default = { VITE_SUPABASE_URL: "http://192.168.1.144:8000", VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE", VITE_CJS_IGNORE_WARNING: "true", VITE_ROOT_DIR: "C:/Users/j/Desktop/宝可梦图鉴 - 副本 (2)", VITE_USER_NODE_ENV: "development", BASE_URL: "/", MODE: "development", DEV: true, PROD: false, SSR: false };
  const _sfc_main$1 = {
    data() {
      return {
        loading: true,
        showBackTop: false,
        activeGenId: null,
        generations: [],
        groupedByGen: {},
        supabaseUrl: "",
        supabaseKey: ""
      };
    },
    computed: {
      activeGen() {
        return this.generations.find((g) => g.id === this.activeGenId) || null;
      },
      activeGenGames() {
        if (!this.activeGen)
          return [];
        return this.groupedByGen[this.activeGen.id] || [];
      }
    },
    onLoad(query) {
      const index = query && (query.index || query.pokemon_index);
      if (!index) {
        formatAppLog("warn", "at pages/wiki/wiki.vue:71", "[wiki] 缺少 index 参数");
        this.loading = false;
        return;
      }
      this.bootstrapEnv();
      this.fetchFlavorText(Number(index));
      if (typeof window !== "undefined") {
        window.addEventListener("scroll", this.handleScroll, { passive: true });
      }
    },
    onUnload() {
      if (typeof window !== "undefined") {
        window.removeEventListener("scroll", this.handleScroll);
      }
    },
    methods: {
      // 注入环境变量（H5/APP 通用）
      bootstrapEnv() {
        try {
          const env = typeof { url: _documentCurrentScript && _documentCurrentScript.src || new URL("app-service.js", document.baseURI).href } !== "undefined" && define_import_meta_env_default ? define_import_meta_env_default : {};
          this.supabaseUrl = env && env.VITE_SUPABASE_URL ? String(env.VITE_SUPABASE_URL) : "";
          this.supabaseKey = env && env.VITE_SUPABASE_ANON_KEY ? String(env.VITE_SUPABASE_ANON_KEY) : "";
        } catch (e) {
        }
        if ((!this.supabaseUrl || !this.supabaseKey) && typeof uni !== "undefined") {
          try {
            uni.request({
              url: "/static/app-config.json",
              method: "GET",
              success: (res) => {
                const cfg = res && res.data ? res.data : null;
                if (cfg && cfg.supabaseUrl && cfg.supabaseAnonKey) {
                  this.supabaseUrl = String(cfg.supabaseUrl);
                  this.supabaseKey = String(cfg.supabaseAnonKey).replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\r?\n/g, "").trim();
                }
              }
            });
          } catch (e) {
          }
        }
      },
      async fetchFlavorText(pokemonId) {
        this.loading = true;
        try {
          const base = (this.supabaseUrl || "").replace(/\/$/, "");
          if (!base || !this.supabaseKey)
            throw new Error("缺少 Supabase 配置");
          const headers = { "apikey": this.supabaseKey, "Authorization": `Bearer ${this.supabaseKey}`, "Accept": "application/json" };
          const key = String(pokemonId);
          const url = `${base}/rest/v1/flavor_texts?select=generation,version,text,pokemon_id&pokemon_id=eq.${encodeURIComponent(key)}&order=generation.asc,version.asc`;
          formatAppLog("log", "at pages/wiki/wiki.vue:122", "[wiki:fetchFlavorText] url=", url);
          const res = await new Promise((resolve, reject) => {
            uni.request({ url, method: "GET", header: headers, timeout: 12e3, success: resolve, fail: reject });
          });
          formatAppLog("log", "at pages/wiki/wiki.vue:126", "[wiki:req] status=", res.statusCode, " len=", Array.isArray(res.data) ? res.data.length : -1, " sample=", Array.isArray(res.data) && res.data.length ? res.data[0] : null);
          if (res.statusCode < 200 || res.statusCode >= 300)
            throw new Error("HTTP " + res.statusCode);
          const rows = Array.isArray(res.data) ? res.data : [];
          const toGenId = (val) => {
            if (val == null || val === "")
              return 1;
            if (typeof val === "number" && Number.isFinite(val))
              return val;
            const s = String(val);
            const m = s.match(/\d+/);
            if (m) {
              const n = Number(m[0]);
              if (Number.isFinite(n) && n > 0)
                return n;
            }
            const zhMap = { "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9 };
            for (const k in zhMap) {
              if (s.includes(k))
                return zhMap[k];
            }
            return 1;
          };
          const groups = {};
          rows.forEach((r) => {
            var _a, _b, _c, _d, _e, _f;
            const g = toGenId(r.generation);
            const version = (_c = (_b = (_a = r.version) != null ? _a : r.version_name) != null ? _b : r.game) != null ? _c : "";
            const text = (_f = (_e = (_d = r.text) != null ? _d : r.flavor_text) != null ? _e : r.description) != null ? _f : "";
            if (!groups[g])
              groups[g] = [];
            groups[g].push({ version, text });
          });
          const gens = Object.keys(groups).map((k) => Number(k)).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
          formatAppLog("log", "at pages/wiki/wiki.vue:153", "[wiki:fetchFlavorText] gens=", gens, " groupSizes=", gens.map((g) => groups[g].length));
          const mapped = gens.map((g) => ({ id: g, name: this.genName(g), nameShort: `第${g}世代`, color: this.genColor(g) }));
          this.generations = mapped;
          this.groupedByGen = groups;
          this.activeGenId = gens[0] || null;
        } catch (e) {
          formatAppLog("warn", "at pages/wiki/wiki.vue:159", "[wiki] 获取 flavor_text 失败:", e);
          this.generations = [];
          this.groupedByGen = {};
          this.activeGenId = null;
        } finally {
          this.loading = false;
        }
      },
      genName(g) {
        const map = {
          1: "第一世代 (1996-1999)",
          2: "第二世代 (1999-2002)",
          3: "第三世代 (2002-2006)",
          4: "第四世代 (2006-2010)",
          5: "第五世代 (2010-2013)",
          6: "第六世代 (2013-2016)",
          7: "第七世代 (2016-2019)",
          8: "第八世代 (2019-2023)",
          9: "第九世代 (2022-至今)"
        };
        return map[g] || `第${g}世代`;
      },
      genColor(g) {
        const map = { 1: "gen1", 2: "gen2", 3: "gen3", 4: "gen4", 5: "gen5", 6: "gen6", 7: "gen7", 8: "gen8", 9: "gen9" };
        return map[g] || "gen1";
      },
      selectGen(id) {
        this.activeGenId = id;
      },
      handleScroll() {
        if (typeof window === "undefined")
          return;
        this.showBackTop = window.pageYOffset > 300;
      },
      backToTop() {
        if (typeof window !== "undefined")
          window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("text", { class: "h1" }, "宝可梦百科"),
        vue.createElementVNode("text", { class: "header-subtitle" }, "探索宝可梦在不同世代游戏中的介绍")
      ]),
      vue.createElementVNode("view", { class: "content-wrapper" }, [
        vue.createElementVNode("view", { class: "generations-nav" }, [
          vue.createElementVNode("text", { class: "nav-title" }, "选择世代"),
          vue.createElementVNode("scroll-view", {
            class: "generation-list",
            "scroll-x": ""
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($data.generations, (gen) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: gen.id,
                  class: vue.normalizeClass(["generation-item", [gen.color, { active: gen.id === $data.activeGenId }]]),
                  onClick: ($event) => $options.selectGen(gen.id)
                }, vue.toDisplayString(gen.nameShort), 11, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ]),
        vue.createElementVNode("view", { class: "content-area" }, [
          $options.activeGen ? (vue.openBlock(), vue.createElementBlock(
            "view",
            {
              key: 0,
              class: vue.normalizeClass(["generation-title", $options.activeGen.color + "-title"])
            },
            vue.toDisplayString($options.activeGen.name),
            3
            /* TEXT, CLASS */
          )) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("view", { class: "games-container" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($options.activeGenGames, (game, idx) => {
                return vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: idx,
                    class: vue.normalizeClass(["game-card", $options.activeGen.color + "-theme"])
                  },
                  [
                    vue.createElementVNode(
                      "view",
                      { class: "game-title" },
                      vue.toDisplayString(game.version),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "view",
                      { class: "game-description" },
                      vue.toDisplayString(game.text),
                      1
                      /* TEXT */
                    )
                  ],
                  2
                  /* CLASS */
                );
              }),
              128
              /* KEYED_FRAGMENT */
            )),
            $data.loading ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "loading"
            }, [
              vue.createElementVNode("view", { class: "loading-spinner" })
            ])) : vue.createCommentVNode("v-if", true),
            !$data.loading && $options.activeGenGames.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "empty"
            }, "暂无该世代数据")) : vue.createCommentVNode("v-if", true)
          ])
        ])
      ]),
      vue.createElementVNode("view", { class: "footer" }, [
        vue.createElementVNode("text", null, "数据来源: 数据库 flavor_text | 本页面仅用于演示目的")
      ]),
      vue.createElementVNode(
        "view",
        {
          class: vue.normalizeClass(["back-to-top", { visible: $data.showBackTop }]),
          onClick: _cache[0] || (_cache[0] = (...args) => $options.backToTop && $options.backToTop(...args))
        },
        "↑",
        2
        /* CLASS */
      )
    ]);
  }
  const PagesWikiWiki = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-0ab94934"], ["__file", "C:/Users/j/Desktop/宝可梦图鉴 - 副本 (2)/pages/wiki/wiki.vue"]]);
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/debug/config", PagesDebugConfig);
  __definePage("pages/detail/detail", PagesDetailDetail);
  __definePage("pages/login/index", PagesLoginIndex);
  __definePage("pages/community/create", PagesCommunityCreate);
  __definePage("pages/wiki/wiki", PagesWikiWiki);
  const _sfc_main = {
    async onLaunch() {
      formatAppLog("log", "at App.vue:5", "App Launch");
      try {
        debugSupabaseEnv("app-launch");
      } catch (e) {
      }
      try {
        const res1 = await probeTable("forms");
        formatAppLog("log", "at App.vue:9", "[Probe] forms =>", res1);
      } catch (e) {
        formatAppLog("warn", "at App.vue:11", "[Probe] forms error =>", e && e.message ? e.message : e);
      }
      try {
        const res2 = await probeTable("pokemons");
        formatAppLog("log", "at App.vue:15", "[Probe] pokemons =>", res2);
      } catch (e) {
        formatAppLog("warn", "at App.vue:17", "[Probe] pokemons error =>", e && e.message ? e.message : e);
      }
    },
    onShow() {
      formatAppLog("log", "at App.vue:21", "App Show");
    },
    onHide() {
      formatAppLog("log", "at App.vue:24", "App Hide");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "C:/Users/j/Desktop/宝可梦图鉴 - 副本 (2)/App.vue"]]);
  (function bootstrapSupabase() {
    try {
      const url = "" ? "" : "http://192.168.1.144:8000";
      const key = "" ? "" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE";
      if (url && key) {
        setSupabaseConfig(String(url), String(key));
        return;
      }
    } catch (e) {
    }
    try {
      uni.request({
        url: "/static/app-config.json",
        method: "GET",
        success: (res) => {
          const cfg = res && res.data ? res.data : null;
          if (cfg && cfg.supabaseUrl && cfg.supabaseAnonKey) {
            const cleaned = String(cfg.supabaseAnonKey).replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\r?\n/g, "").trim();
            setSupabaseConfig(String(cfg.supabaseUrl), cleaned);
          }
        },
        fail: () => {
          uni.request({
            url: "static/app-config.json",
            method: "GET",
            success: (res2) => {
              const cfg2 = res2 && res2.data ? res2.data : null;
              if (cfg2 && cfg2.supabaseUrl && cfg2.supabaseAnonKey) {
                const cleaned2 = String(cfg2.supabaseAnonKey).replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\r?\n/g, "").trim();
                setSupabaseConfig(String(cfg2.supabaseUrl), cleaned2);
              }
            }
          });
        }
      });
    } catch (e) {
    }
  })();
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
