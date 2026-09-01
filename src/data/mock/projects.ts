import type { Project } from "@/types/project";

/**
 * Seed data for the mock projects store. Lives only in this module's memory
 * at runtime (services/mock/projectsService.mock.ts clones it into a mutable
 * array) — resets on every page reload, per the "no persistent local
 * database" constraint. "maalot" carries the REAL content/images of the
 * already-built prototype/project-maalot.html case study, verbatim (converted
 * from <br>/<br><br> to \n/\n\n — ProjectDetailPage renders these with
 * white-space:pre-line, the same convention editor-runtime.ts already uses
 * for plain-text overrides). The other two are lightweight fixtures used to
 * exercise search/filter/prev-next/partial-gallery states in the dashboard
 * and public page.
 */
export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-maalot",
    slug: "maalot",
    title: "מעלות",
    hero_image_path: "mock/project-maalot/hero.jpg",
    hero_image_url: "/project/571cbf7649d8845ab03bdd535ba921c28f4faffc.jpg",
    hero_image_alt: "מעלות — מיתוג ועיצוב",
    tagline: "תוכנית הכנה רגשית לעולים לישיבה קטנה",
    challenge_text:
      "תוכנית ״מעלות״ הציגה רקורד חינוכי מרשים ומוכח בשטח,\nאך נדרשה לבצע קפיצת מדרגה אסטרטגית:\n\nמעבר מפעילות נקודתית מול מוסדות בודדים – לחדירה\nעקבית למגזר המוסדי, לרשויות המקומיות ולסלי התקצוב\nהממשלתיים. האתגר היה לתרגם את העומק החינוכי והטיפולי\nשל התוכנית לשפה עסקית ומכרזית, שתדבר במדויק אל\nמקבלי ההחלטות בדרגים הגבוהים.",
    solution_text:
      "יצרנו תשתית אסטרטגית המותאמת לעבודה מול רשויות (B2G)\nבשלב הראשון, זיקקנו זהות מותגית המשדרת יציבות וסמכות מקצועית.\n\nבשלב השני, דייקנו את מיצוב התוכנית מ״סדנה חווייתית״ ל״תוכנית\nהתערבות מקצועית למניעת נשירה״ - צעד שאפשר את חיבור התוכנית\nלסעיפי תקצוב עירוניים וממשלתיים.\n\nהתהליך גובה בפיתוח מצגת מרשימה ובפרוספקט מוסדי מהודק\nהמדגיש את מודל העלות-תועלת עבור הרשות, ומציג את החיסכון\nהכלכלי והקהילתי שבהשקעה במניעה מוקדמת.",
    subtitle: "כותרת מתאימה",
    extra_paragraph:
      "אם יש הסבר קטן על שאר התוצרים אם יש הסבר קטן על\nשאר התוצרים אם יש הסבר קטן על שאר התוצרים",
    result_text:
      "המותג יצא עם מעטפת מקצועית שלמה וארגז\nכלים אסטרטגי שאפשר כניסה חלקה למאגר גפ״ן\nולעבודה מול רשויות חרדיות.\n\nהתוכנית השלימה פיילוט מוצלח בשטח,\nעם המלצות חמות מהנהלות המוסדות על שינוי\nניכר במוכנות הנערים.",
    testimonial_text: "(כאן יבוא ציטוט המלצה מהלקוח)",
    status: "published",
    published_at: "2026-07-05T09:00:00.000Z",
    created_by: null,
    created_at: "2026-06-20T09:00:00.000Z",
    updated_at: "2026-08-24T19:07:00.000Z",
  },
  {
    id: "proj-sample-b",
    slug: "sample-business-draft",
    title: "עסק לדוגמה — טיוטה",
    hero_image_path: "mock/sample-b/hero.jpg",
    hero_image_url: "/project/8eb903c3e9303f83c7281db48acbd7b0d3fc0f62.jpg",
    hero_image_alt: "עסק לדוגמה — תמונת נושא",
    tagline: "פרויקט לדוגמה בעבודה — עדיין לא פורסם",
    challenge_text: "טקסט האתגר לדוגמה, עדיין בעריכה.",
    solution_text: "טקסט הפתרון לדוגמה, עדיין בעריכה.",
    subtitle: "כותרת משנה לדוגמה",
    extra_paragraph: "פסקה נוספת לדוגמה.",
    result_text: "טקסט התוצאה בשטח, לדוגמה.",
    testimonial_text: "המלצת לקוח לדוגמה.",
    status: "draft",
    published_at: null,
    created_by: null,
    created_at: "2026-08-10T09:00:00.000Z",
    updated_at: "2026-08-27T12:00:00.000Z",
  },
  {
    id: "proj-sample-c",
    slug: "sample-business-published",
    title: "עסק לדוגמה — פורסם",
    hero_image_path: "mock/sample-c/hero.jpg",
    hero_image_url: "/project/97a6da12c1b5085b0753dceadded18021c06a252.jpg",
    hero_image_alt: "עסק לדוגמה — תמונת נושא",
    tagline: "פרויקט לדוגמה שני, מפורסם",
    challenge_text: "טקסט האתגר לדוגמה עבור הפרויקט השני.",
    solution_text: "טקסט הפתרון לדוגמה עבור הפרויקט השני.",
    subtitle:
      "כותרת משנה ארוכה במיוחד שנועדה לבדוק שהיא לא חופפת את הפסקה שלצדה גם כשהיא נשברת למספר שורות",
    extra_paragraph:
      "פסקה נוספת עבור הפרויקט השני. גם הפסקה הזו יכולה להיות ארוכה יחסית, עם כמה משפטים שממשיכים זה את זה כדי לבדוק שהאזור גדל בהתאם לתוכן משני הצדדים בלי חפיפה.",
    result_text: "טקסט התוצאה בשטח עבור הפרויקט השני.",
    testimonial_text: "המלצת לקוח עבור הפרויקט השני.",
    status: "draft",
    published_at: null,
    created_by: null,
    created_at: "2026-08-01T09:00:00.000Z",
    updated_at: "2026-08-20T09:00:00.000Z",
  },
];
