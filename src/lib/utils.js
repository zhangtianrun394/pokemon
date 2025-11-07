
// Helper to construct image URL from form_id
export function getImageUrl(formId) {
  // 确保 formId 是字符串类型，如果不是则转换为字符串
  const safeFormId = String(formId || '');
  
  if (!safeFormId) return '';
  
  // 如果已经是完整的 URL，直接返回
  if (safeFormId.startsWith('http://') || safeFormId.startsWith('https://')) {
    return safeFormId;
  }
  
  // 如果是本地路径，保持原有逻辑
  if (safeFormId.startsWith('/static/')) {
    return safeFormId;
  }
  
  // 存储桶中图片命名规则：form_id + ".png"
  // 例如：form_id = "0001_0"，图片文件名 = "0001_0.png"
  return `https://ppyigzumhwpvmkfxrjpv.supabase.co/storage/v1/object/public/pokemon_image/${safeFormId}.png`;
}
