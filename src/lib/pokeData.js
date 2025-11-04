// Cross-platform data access for H5 and App (Android/iOS)
// H5 can still use supabase-js if needed, but to avoid App Service global issues,
// we default to Supabase REST via uni.request on all platforms for stability.

let cachedUrl = ''
let cachedKey = ''

// Base64 解码函数（兼容 uni-app）
function decodeBase64(str) {
  try {
    // 优先使用 uni-app 的 API
    if (typeof uni !== 'undefined' && uni.base64ToArrayBuffer) {
      const buffer = uni.base64ToArrayBuffer(str)
      return String.fromCharCode.apply(null, new Uint8Array(buffer))
    }
    // 回退到标准 atob
    return atob(str)
  } catch (e) {
    console.error('[Base64] 解码失败:', e)
    return ''
  }
}

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
          if (cfg && cfg.supabaseUrl) {
            cachedUrl = cachedUrl || String(cfg.supabaseUrl)
            // 解码 Base64 编码的 Key，避免 Vite 处理
            if (cfg.encodedKey) {
              try {
                const decoded = decodeBase64(cfg.encodedKey)
                cachedKey = cachedKey || decoded.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\r?\n/g, '').trim()
              } catch (e) {
                console.warn('[SupabaseEnv] Base64 解码失败:', e)
              }
            } else if (cfg.keyPart1 && cfg.keyPart2 && cfg.keyPart3) {
              // 兼容分段格式
              const reconstructedKey = cfg.keyPart1 + '.' + cfg.keyPart2 + '.' + cfg.keyPart3
              cachedKey = cachedKey || reconstructedKey.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\r?\n/g, '').trim()
            } else if (cfg.supabaseAnonKey) {
              // 兼容旧格式
              const rawKey = String(cfg.supabaseAnonKey)
              cachedKey = cachedKey || rawKey.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\r?\n/g, '').trim()
            }
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
    // 最终兜底：使用 Base64 编码的默认 Key
    if (!cachedUrl) cachedUrl = 'https://ppyigzumhwpvmkfxrjpv.supabase.co'
    if (!cachedKey) {
      // 这是 Base64 编码的默认 JWT Token，避免 Vite 识别
      const encodedDefault = 'ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5TG1WNVNuTnpJblZ3WVdKaGMyVWlMQ0p5WldZaU9pSndjSGw1YVdkNmRXMW9kM0IyYldzbWVISnFjSFpqSWl3aWNtOXNaU0k2SW1GdWIyNGlMQ0pwWVhRaU9qRTNOakE0TlRZNU9EWXNJbVY0Y0NJNk1qQTNOalF6TWprek9EWjlMbmR5VlVGWlgzQnlWRE5zT0V0VFMzVmhaVVpzWVZVemJIQXllV0ZxTm5ocVJreHpiamdmUzFobVFVVT0='
      cachedKey = decodeBase64(encodedDefault)
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
  console.log('[版本检查] pokeData.js 已更新 - 2025-01-28-v9-color-abilities-fix')
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
  let headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'apikey': keyClean,
    'Authorization': `Bearer ${keyClean}`
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
          console.log(`[诊断] 成功读取 types 表, 使用字段: '${select}', 返回 ${rows.length} 条记录`);
          if (select.startsWith('id,')) {
            return rows.map(r => ({ type_id: r.id, type_name: r.type_name ?? r.name }));
          }
          if (select.includes(',name')) {
            return rows.map(r => ({ type_id: r.type_id, type_name: r.name }));
          }
          return rows;
      }
    } catch (e) {
      console.warn(`[诊断] 尝试读取 types 表失败, 使用字段: '${select}'. 错误:`, e.message);
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
          /* silent: no forms_types mapping for this form; forms_id= */
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
  
  console.log('[fetchFormById] 开始查询 forms 表，forms_id:', formsId)
  
  // 获取 forms 表中的所有需要字段：image, genus, height, weight, shape, color
  const form = await uniGet('forms', { 
    select: 'forms_id,pokemon_id,form_name,image,genus,height,weight,shape,color,types', 
    forms_id: `eq.${formsId}`, 
    limit: 1 
  }).then(r => r[0]);
  
  if (!form) {
    console.warn('[fetchFormById] 未找到对应的 form，forms_id:', formsId)
    return null;
  }

  console.log('[fetchFormById] 找到 form 数据:', {
    forms_id: form.forms_id,
    pokemon_id: form.pokemon_id,
    form_name: form.form_name,
    image: form.image,
    genus: form.genus,
    height: form.height,
    weight: form.weight,
    shape: form.shape
  })

  // 处理属性信息（保持原有逻辑）
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

export async function fetchPokemonByIdAndName(pokemonId, formName) {
  await initSupabaseEnv()
  
  console.log('[fetchPokemonByIdAndName] 开始查询 pokemons 表')
  console.log('  - forms.pokemon_id:', pokemonId)
  console.log('  - forms.form_name:', formName)
  
  // 正确的关联关系：forms.pokemon_id = pokemons.index AND forms.form_name = pokemons.name
  try {
    const pokemon = await uniGet('pokemons', { 
      select: 'index,name,name_en,name_jp,profile,poke_id', 
      index: `eq.${pokemonId}`,
      name: `eq.${formName}`,
      limit: 1 
    }).then(r => r[0])
    
    if (pokemon) {
      console.log('[fetchPokemonByIdAndName] 找到精确匹配的 pokemon 数据:', {
        index: pokemon.index,
        name: pokemon.name,
        name_en: pokemon.name_en,
        name_jp: pokemon.name_jp,
        poke_id: pokemon.poke_id,
        profile_length: pokemon.profile ? pokemon.profile.length : 0
      })
      return pokemon
    } else {
      console.warn('[fetchPokemonByIdAndName] 未找到精确匹配的 pokemon')
      console.warn('  - 查询条件: index =', pokemonId, 'AND name =', formName)
    }
  } catch (e) {
    console.error('[fetchPokemonByIdAndName] 查询失败:', e)
  }
  
  // 回退方案：只用 index 查询，然后手动筛选
  try {
    console.log('[fetchPokemonByIdAndName] 尝试回退方案：只用 index 查询')
    const candidates = await uniGet('pokemons', { 
      select: 'index,name,name_en,name_jp,profile,poke_id', 
      index: `eq.${pokemonId}`
    })
    
    console.log('[fetchPokemonByIdAndName] 找到候选数据:', candidates.length, '条')
    
    // 手动筛选匹配的 name
    const matched = candidates.find(p => p.name === formName)
    if (matched) {
      console.log('[fetchPokemonByIdAndName] 回退方案成功匹配:', matched.name)
      return matched
    } else {
      console.warn('[fetchPokemonByIdAndName] 回退方案也未找到匹配')
      console.warn('  - 候选名称:', candidates.map(p => p.name))
      console.warn('  - 目标名称:', formName)
    }
  } catch (e) {
    console.error('[fetchPokemonByIdAndName] 回退方案失败:', e)
  }
  
  return null
}

export async function fetchAbilitiesByPokemonId(pokemonId, formName) {
  await initSupabaseEnv()
  
  console.log('[fetchAbilitiesByPokemonId] 开始查询特性')
  console.log('  - pokemonId:', pokemonId)
  console.log('  - formName:', formName)
  
  // 步骤1: 通过 forms.pokemon_id 和 form_name 获取精确的 pokemons.poke_id
  let actualPokeId = null
  try {
    // 使用双重匹配：index 和 name 都要匹配
    const pokemon = await uniGet('pokemons', { 
      select: 'poke_id', 
      index: `eq.${pokemonId}`,
      name: `eq.${formName}`,
      limit: 1 
    }).then(r => r[0])
    
    if (pokemon && pokemon.poke_id) {
      actualPokeId = pokemon.poke_id
      console.log('[fetchAbilitiesByPokemonId] 找到精确匹配的 poke_id:', actualPokeId)
    } else {
      console.warn('[fetchAbilitiesByPokemonId] 未找到精确匹配的 pokemon')
      console.warn('  - pokemonId:', pokemonId, 'formName:', formName)
      return []
    }
  } catch (e) {
    console.error('[fetchAbilitiesByPokemonId] 查询 pokemons 表失败:', e)
    return []
  }
  
  // 步骤2: 通过 pokemons.poke_id 在 pokemon_abilities 中间表查找 ability_id
  let pokemonAbilities = []
  try {
    pokemonAbilities = await uniGet('pokemon_abilities', { 
      select: 'ability_id,is_hidden', 
      poke_id: `eq.${actualPokeId}` 
    })
    console.log('[fetchAbilitiesByPokemonId] 找到特性关联:', pokemonAbilities)
  } catch (e) {
    console.error('[fetchAbilitiesByPokemonId] 查询 pokemon_abilities 表失败:', e)
    return []
  }
  if (!pokemonAbilities || pokemonAbilities.length === 0) {
    console.log('[fetchAbilitiesByPokemonId] 未找到特性关联数据')
    return []
  }

  // 步骤3: 通过 ability_id 从 abilities 表获取特性详情
  const abilityIds = pokemonAbilities.map(pa => pa.ability_id).filter(id => id != null)
  if (abilityIds.length === 0) {
    console.log('[fetchAbilitiesByPokemonId] 没有有效的 ability_id')
    return []
  }

  console.log('[fetchAbilitiesByPokemonId] 查询特性详情，ability_ids:', abilityIds)
  
  let abilities = []
  try {
    abilities = await uniGet('abilities', { 
      select: 'ability_id,name,description', 
      ability_id: `in.(${abilityIds.join(',')})` 
    })
    console.log('[fetchAbilitiesByPokemonId] 找到特性详情:', abilities)
  } catch (e) {
    console.error('[fetchAbilitiesByPokemonId] 查询 abilities 表失败:', e)
    return []
  }

  const abilityMap = new Map(abilities.map(a => [a.ability_id, a]))

  const result = pokemonAbilities.map(pa => {
    const abilityDetail = abilityMap.get(pa.ability_id) || {}
    return {
      ...abilityDetail,
      is_hidden: pa.is_hidden
    }
  })

  console.log('[fetchAbilitiesByPokemonId] 最终结果:', result)
  return result
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

// 优化的详情页数据获取函数 - 减少查询次数，提高加载速度
export async function fetchPokemonDetailOptimized(formsId) {
  await initSupabaseEnv()
  
  try {
    // 步骤1: 获取form基础信息（必须先执行，因为需要pokemon_id和form_name）
    const form = await uniGet('forms', { 
      select: 'forms_id,pokemon_id,form_name,image,genus,height,weight,shape,color,types', 
      forms_id: `eq.${formsId}`, 
      limit: 1 
    }).then(r => r[0]);
    
    if (!form) {
      throw new Error('Form not found');
    }

    // 步骤2: 并行执行所有后续查询（关键优化点）
    const [pokemon, abilities] = await Promise.all([
      // 并行查询1: 获取pokemon基础信息
      uniGet('pokemons', { 
        select: 'index,name,name_en,name_jp,profile,poke_id', 
        index: `eq.${form.pokemon_id}`,
        name: `eq.${form.form_name}`,
        limit: 1 
      }).then(r => r[0] || null),
      
      // 并行查询2: 获取abilities信息（嵌套并行查询）
      (async () => {
        // 2.1 先获取poke_id
        const pokemonForAbility = await uniGet('pokemons', { 
          select: 'poke_id', 
          index: `eq.${form.pokemon_id}`,
          name: `eq.${form.form_name}`,
          limit: 1 
        }).then(r => r[0]);
        
        if (!pokemonForAbility) return [];
        
        // 2.2 并行获取ability关联和详情
        const [pokemonAbilities, allAbilities] = await Promise.all([
          uniGet('pokemon_abilities', { 
            select: 'ability_id,is_hidden', 
            poke_id: `eq.${pokemonForAbility.poke_id}` 
          }),
          // 预先获取所有可能需要的ability详情（减少查询次数）
          uniGet('abilities', { 
            select: 'ability_id,name,description'
          })
        ]);
        
        if (!pokemonAbilities || pokemonAbilities.length === 0) return [];
        
        // 在内存中匹配，避免额外的数据库查询
        return pokemonAbilities.map(pa => {
          const detail = allAbilities.find(ad => ad.ability_id === pa.ability_id);
          return {
            name: detail ? detail.name : '未知特性',
            description: detail ? detail.description : '暂无描述',
            is_hidden: pa.is_hidden
          };
        });
      })()
    ]);

    // 步骤3: 处理types数据（使用form.types字段，避免额外查询）
    let typesZh = [];
    let typesEn = [];
    
    // 中文到英文的类型映射
    const typeMap = {
      '草': 'grass',
      '毒': 'poison', 
      '火': 'fire',
      '水': 'water',
      '电': 'electric',
      '一般': 'normal',
      '超能力': 'psychic',
      '飞行': 'flying',
      '幽灵': 'ghost',
      '龙': 'dragon',
      '岩石': 'rock',
      '地面': 'ground',
      '钢': 'steel',
      '恶': 'dark',
      '妖精': 'fairy',
      '冰': 'ice',
      '虫': 'bug',
      '格斗': 'fighting'
    };
    
    if (form.types) {
      try {
        // 如果是JSON格式
        if (typeof form.types === 'string') {
          const types = JSON.parse(form.types);
          if (Array.isArray(types)) {
            typesZh = types;
          } else {
            typesZh = [types];
          }
        } else if (Array.isArray(form.types)) {
          // 如果已经是数组
          typesZh = form.types;
        }
        
        // 转换为英文类名
        typesEn = typesZh.map(t => typeMap[t] || 'normal');
      } catch (e) {
        console.warn('解析types失败:', e);
        typesZh = ['未知'];
        typesEn = ['normal'];
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
    console.error('[fetchPokemonDetailOptimized] 查询失败:', error);
    throw error;
  }
}