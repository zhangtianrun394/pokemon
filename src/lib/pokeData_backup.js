// Cross-platform data access for H5 and App (Android/iOS)
// H5 can still use supabase-js if needed, but to avoid App Service global issues,
// we default to Supabase REST via uni.request on all platforms for stability.

let cachedUrl = ''
let cachedKey = ''

// 懒加载 Supabase 环境变量
async function ensureEnvLoaded() {
  if (cachedUrl && cachedKey) return
  // 1) 构建期注入常量
  if (typeof __SUPABASE_URL__ !== 'undefined' && __SUPABASE_URL__) {
    cachedUrl = __SUPABASE_URL__
  }
  if (typeof __SUPABASE_ANON_KEY__ !== 'undefined' && __SUPABASE_ANON_KEY__) {
    cachedKey = __SUPABASE_ANON_KEY__
  }
  // 2) H5: import.meta.env
  try {
    const envObj = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {}
    if (!cachedUrl && envObj && envObj.VITE_SUPABASE_URL) cachedUrl = envObj.VITE_SUPABASE_URL
    if (!cachedKey && envObj && envObj.VITE_SUPABASE_ANON_KEY) cachedKey = envObj.VITE_SUPABASE_ANON_KEY
  } catch (e) {}
  // 3) 兜底：运行时从 static/app-config.json 拉取
  if (!cachedUrl || !cachedKey) {
    const tryFetch = (path) => new Promise((resolve) => {
      uni.request({
        url: path,
        method: 'GET',
        success: (res) => {
          const cfg = res && res.data ? res.data : null
          if (cfg && cfg.supabaseUrl && cfg.supabaseAnonKey) {
            cachedUrl = cachedUrl || String(cfg.supabaseUrl)
            const rawKey = String(cfg.supabaseAnonKey)
            // 清洗潜在的不可见字符/换行，避免原生层传递头部异常
            cachedKey = cachedKey || rawKey.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\r?\n/g, '').trim()
          }
          resolve(true)
        },
        fail: () => resolve(false)
      })
    })
    let ok = await tryFetch('/static/app-config.json')
    if ((!cachedUrl || !cachedKey)) {
      await tryFetch('static/app-config.json')
    }
    // 最终兜底：写入了默认项目常量，避免 App 端读取失败导致 401
    // 使用字符串拼接避免 Vite 处理导致 Key 损坏
    if (!cachedUrl) cachedUrl = 'https://ppyigzumhwpvmkfxrjpv.supabase.co'
    if (!cachedKey) {
      const keyParts = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBweWlnenVtaHdwdm1rZnhyanB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NTY5ODYsImV4cCI6MjA3NjQzMjk4Nn0',
        '7rUQY_prT3l8KSKuaEFalU3lp2yaj6xjFLSn8_KXfAE'
      ]
      cachedKey = keyParts.join('.')
    }
  }
}

export function setSupabaseConfig(url, key) {
  if (url) cachedUrl = url
  if (key) cachedKey = key
}

function buildQuery(params) {
  const parts = []
  for (var k in params) {
    if (Object.prototype.hasOwnProperty.call(params, k)) {
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
    }
  }
  return parts.length ? '?' + parts.join('&') : ''
}

export async function initSupabaseEnv() {
  await ensureEnvLoaded()
  console.log('[版本检查] pokeData.js 已更新 - 2025-01-28-v2')
}

export function debugSupabaseEnv(tag = 'debug') {
  const url = cachedUrl || '(empty)'
  const key = cachedKey ? (cachedKey.slice(0, 8) + '...') : '(empty)'
  const keyLen = cachedKey ? String(cachedKey).length : 0
  console.log(`[SupabaseEnv:${tag}] url=`, url, ' key=', key, ' len=', keyLen)
}

async function buildRest(path, params) {
  await ensureEnvLoaded()
  if (!cachedUrl || !cachedKey) {
    console.error('[SupabaseEnv] missing url/key before buildRest:', { url: cachedUrl, keyHead: cachedKey ? cachedKey.slice(0,8) : '' })
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  }
  const qs = buildQuery(params || {})
  const full = cachedUrl.replace(/\/$/, '') + '/rest/v1/' + path + (qs || '')
  const keyClean = String(cachedKey).replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\r?\n/g, '').trim()
  const headers = {
    'apikey': keyClean,
    'Authorization': `Bearer ${keyClean}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'uni-app'
  }
  console.log('[SupabaseEnv] using url=', cachedUrl, ' keyHead=', (cachedKey||'').slice(0,8))
  return { full, headers }
}

function uniGet(path, params) {
  return new Promise(async (resolve, reject) => {
    let conf
    try {
      conf = await buildRest(path, params)
    } catch (e) {
      reject(e); return
    }
    
    // 详细请求日志，用于诊断 App 端头部传递问题
    console.log('[请求诊断] URL:', conf.full)
    console.log('[请求诊断] Headers:', JSON.stringify(conf.headers, null, 2))
    
    uni.request({
      url: conf.full,
      method: 'GET',
      header: conf.headers,
      success: (res) => {
        console.log('[请求诊断] 响应状态:', res.statusCode)
        console.log('[请求诊断] 响应数据:', JSON.stringify(res.data).slice(0, 200))
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data || [])
        else reject(new Error('HTTP ' + res.statusCode +  ': ' + JSON.stringify(res.data)))
      },
      fail: (err) => {
        console.log('[请求诊断] 请求失败:', JSON.stringify(err))
        reject(err)
      }
    })
  })
}

function normalizeTypeLocal(t) {
  if (!t) return ''
  const s = String(t).trim().toLowerCase()
  const map = {
    '火': 'fire', 'fire': 'fire',
    '水': 'water', 'water': 'water',
    '草': 'grass', 'grass': 'grass',
    '电': 'electric', '雷': 'electric', 'electric': 'electric',
    '毒': 'poison', 'poison': 'poison',
    '一般': 'normal', 'normal': 'normal',
    '超能力': 'psychic', 'psychic': 'psychic',
    '飞行': 'flying', 'flying': 'flying',
    '幽灵': 'ghost', 'ghost': 'ghost',
    '龙': 'dragon', 'dragon': 'dragon',
    '岩石': 'rock', 'rock': 'rock',
    '地面': 'ground', 'ground': 'ground',
    '钢': 'steel', 'steel': 'steel',
    '恶': 'dark', 'dark': 'dark',
    '妖精': 'fairy', 'fairy': 'fairy',
    '冰': 'ice', 'ice': 'ice',
    '虫': 'bug', 'bug': 'bug',
    '格斗': 'fighting', 'fighting': 'fighting'
  }
  return map[s] || s
}

// --- 首页数据获取 ---

async function fetchPokemonFormsFull() {
  try {
    const rows = await uniGet('forms', {
      select: 'pokemon_id,forms_id,form_name,types,image',
      order: 'forms_id.asc',
      limit: '5000'
    })
    return rows.map(r => ({
      pokemon_id: r.pokemon_id,
      forms_id: r.forms_id,
      form_name: r.form_name,
      types: r.types,
      image: r.image
    }))
  } catch (e) {
    const rows = await uniGet('forms', {
      select: 'pokemon_id,form_id,form_name,types,image',
      order: 'form_id.asc',
      limit: '5000'
    })
     return rows.map(r => ({
      pokemon_id: r.pokemon_id,
      forms_id: r.form_id, // 别名
      form_name: r.form_name,
      types: r.types,
      image: r.image
    }))
  }
}

async function fetchFormsTypes() {
  try {
    const rows = await uniGet('forms_types', {
      select: 'forms_id,type_id',
      order: 'forms_id.asc',
      limit: '20000'
    })
    return rows.map(r => ({ forms_id: r.forms_id, type_id: r.type_id }))
  } catch (e) {
    const rows = await uniGet('forms_types', {
      select: 'form_id,type_id',
      order: 'form_id.asc',
      limit: '20000'
    })
    return rows.map(r => ({ forms_id: r.form_id, type_id: r.type_id }))
  }
}

async function fetchTypesAll() {
  const candidates = [
    'type_id,type_name',
    'id,type_name',
    'type_id,name',
    'id,name'
  ];
  for (const select of candidates) {
    try {
      const rows = await uniGet('types', { select, limit: '2000' });
      if (rows && rows.length > 0) {
          console.log(`[诊断] 成功读取 types 表, 使用字段: '\${select}', 返回 \${rows.length} 条记录`);
          if (select.startsWith('id,')) {
            return rows.map(r => ({ type_id: r.id, type_name: r.type_name ?? r.name }));
          }
          if (select.includes(',name')) {
            return rows.map(r => ({ type_id: r.type_id, type_name: r.name }));
          }
          return rows;
      }
    } catch (e) {
      console.warn(`[诊断] 尝试读取 types 表失败, 使用字段: '\${select}'. 错误:`, e.message);
    }
  }
  console.error('[诊断] types 表所有字段组合读取尝试均失败，请检查 RLS/列名/表权限。');
  return [];
}

async function fetchPokemonImages() {
  return await uniGet('images', {
    select: 'pokemon_id,image',
    limit: '2000'
  })
}

export async function fetchAllForHomeJunction() {
  // 确保在任何请求前已加载 URL/KEY（App 端尤为重要）
  await initSupabaseEnv()
  debugSupabaseEnv('home')
  const [formsResult, imagesResult, formsTypesResult, typesResult] = await Promise.allSettled([
    fetchPokemonFormsFull(),
    fetchPokemonImages(),
    fetchFormsTypes(),
    fetchTypesAll()
  ]);

  const errors = [];
  const getVal = (result, index) => {
    if (result.status === 'fulfilled') return result.value || [];
    errors.push({ index, reason: String(result.reason?.message ?? result.reason) });
    return [];
  };

  const forms = getVal(formsResult, 0);
  const images = getVal(imagesResult, 1);
  const formsTypes = getVal(formsTypesResult, 2);
  const types = getVal(typesResult, 3);
  
  console.log('[诊断] forms数:', forms.length, 'forms_types数:', formsTypes.length, 'types数:', types.length);

  const formIdToTypeIds = new Map();
  for (const ft of formsTypes) {
    const fid = ft.forms_id;
    const tid = ft.type_id;
    if (fid != null && tid != null) {
      if (!formIdToTypeIds.has(fid)) formIdToTypeIds.set(fid, []);
      formIdToTypeIds.get(fid).push(tid);
    }
  }

  const typeIdToName = new Map();
  for (const t of types) {
    if (t && t.type_id != null) typeIdToName.set(t.type_id, t.type_name);
  }
   if (types.length === 0) {
    console.warn('[诊断] types 映射为空，属性名称将回退自 forms.types 或显示为空');
  }

  const pidToImage = new Map();
  for (const im of images) {
    if (im && im.pokemon_id != null && im.image) pidToImage.set(im.pokemon_id, im.image);
  }

  const data = forms.map(f => {
    const formId = f.forms_id;
    const pnameZh = f.form_name || '';
    let typesZh = [];
    
    const idsByForm = formIdToTypeIds.get(formId) || [];

    if (idsByForm.length) {
      typesZh = idsByForm.map(id => typeIdToName.get(id)).filter(Boolean);
    } else {
      if(formsTypes.length > 0) { // 只有在forms_types有数据时才警告，避免types表为空时产生大量无效警告
          console.warn('[诊断] 该形态在 forms_types 无映射，forms_id=', formId, 'form_name=', pnameZh);
      }
      let raw = [];
      if (Array.isArray(f.types)) raw = f.types;
      else if (typeof f.types === 'string') raw = String(f.types).split(',').map(s => s.trim()).filter(Boolean);
      typesZh = raw;
    }
    
    const typesEn = (typesZh || []).map(t => normalizeTypeLocal(t)).filter(Boolean);
    const imageName = f.image ? String(f.image) : (pidToImage.get(f.pokemon_id) || '');
    
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
    console.warn('部分数据获取失败（已降级为空数组）', errors);
  }
  
  return { data, errors, formsCount: forms.length };
}


// --- 详情页数据获取 ---

export async function fetchFormById(formsId) {
  await initSupabaseEnv()
  const form = await uniGet('forms', { select: '*', forms_id: `eq.${formsId}`, limit: 1 }).then(r => r[0]);
  if (!form) return null;

  const formsTypes = await uniGet('forms_types', { select: 'type_id', forms_id: `eq.${formsId}` });
  const typeIds = formsTypes.map(ft => ft.type_id);

  let typesZh = [];
  let typesEn = [];
  if (typeIds.length > 0) {
    const types = await uniGet('types', { select: 'type_id,type_name', type_id: `in.(${typeIds.join(',')})` });
    const typeMap = new Map(types.map(t => [t.type_id, t.type_name]));
    typesZh = typeIds.map(id => typeMap.get(id)).filter(Boolean);
  } else if (form.types) {
    typesZh = Array.isArray(form.types) ? form.types : String(form.types).split(',').map(s => s.trim()).filter(Boolean);
  }
  typesEn = typesZh.map(t => normalizeTypeLocal(t));

  return { ...form, typesZh, typesEn };
}

export async function fetchPokemonById(pokemonId) {
  await initSupabaseEnv()
  try {
    const row = await uniGet('pokemons', { select: '*', pokemon_id: `eq.${pokemonId}`, limit: 1 }).then(r => r[0])
    if (row) return row
  } catch (e) {
    // ignore and fallback
  }
  // 回退：有的库使用 poke_id 作为主键
  return await uniGet('pokemons', { select: '*', poke_id: `eq.${pokemonId}`, limit: 1 }).then(r => r[0])
}

export async function fetchAbilitiesByPokemonId(pokemonId) {
  await initSupabaseEnv()
  let pokemonAbilities = []
  try {
    pokemonAbilities = await uniGet('pokemon_abilities', { select: 'ability_id,is_hidden', pokemon_id: `eq.${pokemonId}` });
  } catch (e) {}
  if (!pokemonAbilities || pokemonAbilities.length === 0) {
    try {
      // 回退：有的库使用 poke_id 作为外键名
      pokemonAbilities = await uniGet('pokemon_abilities', { select: 'ability_id,is_hidden', poke_id: `eq.${pokemonId}` });
    } catch (e) {}
  }
  if (!pokemonAbilities || pokemonAbilities.length === 0) return [];

  const abilityIds = pokemonAbilities.map(pa => pa.ability_id).filter(id => id != null)
  if (abilityIds.length === 0) return []

  const abilities = await uniGet('abilities', { select: 'ability_id,name,description', ability_id: `in.(${abilityIds.join(',')})` });
  const abilityMap = new Map(abilities.map(a => [a.ability_id, a]));

  return pokemonAbilities.map(pa => {
    const abilityDetail = abilityMap.get(pa.ability_id) || {}
    return {
      ...abilityDetail,
      is_hidden: pa.is_hidden
    };
  });
}

// 调试用：探针读取任意表的前1条，返回状态码与是否成功
export async function probeTable(tableName) {
  try {
    // 直接使用 select='*'，避免特定列名导致 400/42703
    const conf = await buildRest(String(tableName), { select: '*', limit: '1' })
    const res = await new Promise((resolve, reject) => {
      uni.request({ url: conf.full, method: 'GET', header: conf.headers, success: resolve, fail: reject })
    })
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return { ok: true, status: res.statusCode }
    }
    return { ok: false, status: res.statusCode, error: JSON.stringify(res.data) }
  } catch (e) {
    return { ok: false, status: 0, error: String(e && e.message ? e.message : e) }
  }
}
