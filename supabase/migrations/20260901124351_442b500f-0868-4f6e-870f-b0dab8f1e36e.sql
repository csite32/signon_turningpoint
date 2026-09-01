do $$
declare
  v_pid   uuid;
  v_admin uuid := '4533fccb-a3db-48d8-aefd-cf1b77979aba';
begin
  if exists (select 1 from public.projects where slug = 'maalot') then
    raise notice 'seed_maalot: already exists, skipping';
    return;
  end if;

  insert into public.projects
    (slug, title, hero_image_path, hero_image_url, hero_image_alt, tagline,
     challenge_text, solution_text, subtitle, extra_paragraph, result_text, testimonial_text,
     status, sort_order, published_at, created_by, created_at)
  values (
    'maalot',
    'מעלות',
    'public:/project/571cbf7649d8845ab03bdd535ba921c28f4faffc.jpg',
    '/project/571cbf7649d8845ab03bdd535ba921c28f4faffc.jpg',
    'מעלות — מיתוג ועיצוב',
    'תוכנית הכנה רגשית לעולים לישיבה קטנה',
    $maalot_challenge$תוכנית ״מעלות״ הציגה רקורד חינוכי מרשים ומוכח בשטח,
אך נדרשה לבצע קפיצת מדרגה אסטרטגית:

מעבר מפעילות נקודתית מול מוסדות בודדים – לחדירה
עקבית למגזר המוסדי, לרשויות המקומיות ולסלי התקצוב
הממשלתיים. האתגר היה לתרגם את העומק החינוכי והטיפולי
של התוכנית לשפה עסקית ומכרזית, שתדבר במדויק אל
מקבלי ההחלטות בדרגים הגבוהים.$maalot_challenge$,
    $maalot_solution$יצרנו תשתית אסטרטגית המותאמת לעבודה מול רשויות (B2G)
בשלב הראשון, זיקקנו זהות מותגית המשדרת יציבות וסמכות מקצועית.

בשלב השני, דייקנו את מיצוב התוכנית מ״סדנה חווייתית״ ל״תוכנית
התערבות מקצועית למניעת נשירה״ - צעד שאפשר את חיבור התוכנית
לסעיפי תקצוב עירוניים וממשלתיים.

התהליך גובה בפיתוח מצגת מרשימה ובפרוספקט מוסדי מהודק
המדגיש את מודל העלות-תועלת עבור הרשות, ומציג את החיסכון
הכלכלי והקהילתי שבהשקעה במניעה מוקדמת.$maalot_solution$,
    'כותרת מתאימה',
    $maalot_extra$אם יש הסבר קטן על שאר התוצרים אם יש הסבר קטן על
שאר התוצרים אם יש הסבר קטן על שאר התוצרים$maalot_extra$,
    $maalot_result$המותג יצא עם מעטפת מקצועית שלמה וארגז
כלים אסטרטגי שאפשר כניסה חלקה למאגר גפ״ן
ולעבודה מול רשויות חרדיות.

התוכנית השלימה פיילוט מוצלח בשטח,
עם המלצות חמות מהנהלות המוסדות על שינוי
ניכר במוכנות הנערים.$maalot_result$,
    '(כאן יבוא ציטוט המלצה מהלקוח)',
    'published',
    0,
    '2026-07-05T09:00:00.000Z',
    v_admin,
    '2026-06-20T09:00:00.000Z'
  )
  returning id into v_pid;

  insert into public.project_images
    (project_id, gallery_type, storage_path, image_url, alt_text, sort_order)
  values
    (v_pid, 'main_gallery',      'public:/project/c477989541d451d2ea73de1f2a727f5b9a4059d8.jpg', '/project/c477989541d451d2ea73de1f2a727f5b9a4059d8.jpg', 'מעלות — עיצוב אריזה', 0),
    (v_pid, 'main_gallery',      'public:/project/8eb903c3e9303f83c7281db48acbd7b0d3fc0f62.jpg', '/project/8eb903c3e9303f83c7281db48acbd7b0d3fc0f62.jpg', 'מעלות — כרטיסי ביקור', 1),
    (v_pid, 'main_gallery',      'public:/project/76d0483d529dd616e2c4e6be73c00a02bc381cf4.jpg', '/project/76d0483d529dd616e2c4e6be73c00a02bc381cf4.jpg', 'מעלות — נייר מכתבים', 2),
    (v_pid, 'main_gallery',      'public:/project/1c1073f31b70335703073128c793a974a903f5c4.jpg', '/project/1c1073f31b70335703073128c793a974a903f5c4.jpg', 'מעלות — חתימת מייל', 3),
    (v_pid, 'brand_colors',      'public:/project/color1.png', '/project/color1.png', 'לוח צבע מותג 1', 0),
    (v_pid, 'brand_colors',      'public:/project/color2.png', '/project/color2.png', 'לוח צבע מותג 2', 1),
    (v_pid, 'brand_colors',      'public:/project/color3.png', '/project/color3.png', 'לוח צבע מותג 3', 2),
    (v_pid, 'secondary_gallery', 'public:/project/97a6da12c1b5085b0753dceadded18021c06a252.jpg', '/project/97a6da12c1b5085b0753dceadded18021c06a252.jpg', 'מעלות — אלבום הצלחה להצלחה', 0),
    (v_pid, 'secondary_gallery', 'public:/project/17107f9bbdc9e8da7ada227e67ebcfc584b44b44.jpg', '/project/17107f9bbdc9e8da7ada227e67ebcfc584b44b44.jpg', 'מעלות — אריזת התוכנית, סוללים דרך להצלחה', 1),
    (v_pid, 'secondary_gallery', 'public:/project/9c1eec88341ca0f192484b0861917c18752bfb7b.jpg', '/project/9c1eec88341ca0f192484b0861917c18752bfb7b.jpg', 'מעלות — מצגת, ארבעת מוקדי הקושי', 2),
    (v_pid, 'secondary_gallery', 'public:/project/7756c300bf52ea134eedb514a7430f925aedc8a6.jpg', '/project/7756c300bf52ea134eedb514a7430f925aedc8a6.jpg', 'מעלות — מצגת, למה מעלות', 3);
end $$;