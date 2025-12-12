/**
 * Backfill meal image URLs to use Supabase transform (width ~900px, quality 75)
 * Requires environment variables:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *
 * Run: node scripts/backfillOptimizeImages.js
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(url, key);
const TARGET_WIDTH = 900;
const TARGET_QUALITY = 75;

function toOptimizedUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
    transform: { width: TARGET_WIDTH, quality: TARGET_QUALITY },
  });
  return data?.publicUrl || null;
}

function parseStoragePath(imageUrl) {
  // Expecting .../object/public/{bucket}/{path...}
  const match = imageUrl.match(/object\/public\/([^/]+)\/(.+)$/);
  if (!match) return null;
  return { bucket: match[1], path: match[2] };
}

async function run() {
  console.log('Fetching meals to backfill...');
  const { data: meals, error } = await supabase.from('meals').select('id, image_url');
  if (error) {
    console.error('Error fetching meals:', error.message);
    process.exit(1);
  }

  let updated = 0;
  for (const meal of meals || []) {
    if (!meal.image_url) continue;
    const parsed = parseStoragePath(meal.image_url);
    if (!parsed) continue; // skip external URLs

    const optimized = toOptimizedUrl(parsed.bucket, parsed.path);
    if (!optimized || optimized === meal.image_url) continue;

    const { error: updErr } = await supabase
      .from('meals')
      .update({ image_url: optimized })
      .eq('id', meal.id);

    if (updErr) {
      console.warn(`Meal ${meal.id}: failed to update`, updErr.message);
      continue;
    }
    updated += 1;
    console.log(`Updated meal ${meal.id}`);
  }

  console.log(`Done. Updated ${updated} meal image URLs.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
