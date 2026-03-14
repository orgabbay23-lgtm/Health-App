import type { MicronutrientKey } from "./nutrition-utils";
import { formatNutritionValue } from "./nutrition-utils";
import type { UserProfile } from "../store";

export type TrackedNutrientKey =
  | "calories"
  | "protein"
  | "carbs"
  | "fat"
  | MicronutrientKey;

export const NUTRIENT_META: Record<
  TrackedNutrientKey,
  {
    label: string;
    unit: string;
  }
> = {
  calories: { label: "קלוריות", unit: 'קק"ל' },
  protein: { label: "חלבון", unit: "גרם" },
  carbs: { label: "פחמימות", unit: "גרם" },
  fat: { label: "שומן", unit: "גרם" },
  fiber: { label: "סיבים תזונתיים", unit: "גרם" },
  sodium: { label: "נתרן", unit: 'מ"ג' },
  potassium: { label: "אשלגן", unit: 'מ"ג' },
  magnesium: { label: "מגנזיום", unit: 'מ"ג' },
  calcium: { label: "סידן", unit: 'מ"ג' },
  iron: { label: "ברזל", unit: 'מ"ג' },
  vitaminA: { label: "ויטמין A", unit: 'מק"ג RAE' },
  vitaminC: { label: "ויטמין C", unit: 'מ"ג' },
  vitaminD: { label: "ויטמין D", unit: 'מק"ג' },
  vitaminE: { label: "ויטמין E", unit: 'מ"ג' },
  vitaminB12: { label: "ויטמין B12", unit: 'מק"ג' },
};

function getTargetValue(
  nutrient: TrackedNutrientKey,
  userProfile: UserProfile,
): number {
  if (nutrient === "calories") {
    return userProfile.targets.calories;
  }

  if (nutrient === "protein") {
    return userProfile.targets.protein;
  }

  if (nutrient === "carbs") {
    return userProfile.targets.carbs;
  }

  if (nutrient === "fat") {
    return userProfile.targets.fat;
  }

  return userProfile.targets.micronutrients[nutrient];
}

function getVoice(userProfile: UserProfile) {
  const feminine = userProfile.gender === "female";

  return {
    you: feminine ? "את" : "אתה",
    tryVerb: feminine ? "נסי" : "נסה",
    keepVerb: feminine ? "שמרי" : "שמור",
    combineVerb: feminine ? "שלבי" : "שלב",
  };
}

function buildTargetSentence(
  nutrient: TrackedNutrientKey,
  userProfile: UserProfile,
): string {
  const value = getTargetValue(nutrient, userProfile);
  const meta = NUTRIENT_META[nutrient];

  return `היעד האישי שלך הוא ${formatNutritionValue(value)} ${meta.unit}.`;
}

export function generateNutritionalTip(
  nutrient: TrackedNutrientKey,
  userProfile: UserProfile,
): string {
  const { age, gender, goalDeficit, isSmoker, targets } = userProfile;
  const voice = getVoice(userProfile);
  const isWeightLoss = goalDeficit > 0;
  const targetSentence = buildTargetSentence(nutrient, userProfile);

  switch (nutrient) {
    case "calories":
      if (isWeightLoss) {
        return `${targetSentence} האלגוריתם שומר ל-${voice.you} על גרעון מבוקר בלי לרדת מתחת לרצפת הבטיחות הקלינית וה-BMR, כדי לצמצם אובדן מסת שריר ופגיעה אנרגטית.`;
      }

      return `${targetSentence} זהו טווח תחזוקה שמבוסס על ה-BMR, רמת הפעילות וההגנות הקליניות של המערכת כדי לשמור על איזון מטבולי יציב.`;

    case "protein":
      if (age >= 65) {
        return `${targetSentence} מעל גיל 65 חלבון הופך קריטי יותר לשימור מסת שריר ולמאבק באנבוליק רזיסטנס. ${voice.combineVerb} בכל ארוחה מקור עשיר כמו יוגורט, ביצים, דג או טופו.`;
      }

      if (targets.calculations.referenceWeightStrategy === "ideal") {
        return `${targetSentence} החלבון שלך מחושב לפי משקל ייחוס ולא לפי משקל בפועל כדי לשמור על יעד קליני סביר בזמן ירידה במשקל. ${voice.combineVerb} חלבון בכל ארוחה לשובע ולהגנה על השריר.`;
      }

      return `${targetSentence} חלבון גבוה יחסית תומך בשובע, בהתאוששות ובשמירה על מסת שריר, במיוחד אם המטרה שלך היא ירידה במשקל. ${voice.combineVerb} חזה עוף, דגים, קטניות או סקייר לאורך היום.`;

    case "carbs":
      if (isWeightLoss) {
        return `${targetSentence} בגרעון קלורי עדיף שפחמימות יגיעו ממקורות עם נפח וסיבים כמו קטניות, שיבולת שועל, פירות ותפוחי אדמה כדי לשמור על אנרגיה ושובע.`;
      }

      return `${targetSentence} פחמימות הן מקור האנרגיה הזמין שלך. ${voice.keepVerb} על חלוקה מאוזנת לאורך היום והעדף מקורות מלאים במקום סוכרים מהירים.`;

    case "fat":
      return `${targetSentence} המערכת שומרת על רצפת שומן בטוחה כדי לתמוך בהורמונים, בתחושת שובע ובספיגה של ויטמינים מסיסי שומן כמו A, D ו-E. ${voice.combineVerb} טחינה, אבוקדו, אגוזים ושמן זית.`;

    case "fiber":
      if (isWeightLoss) {
        return `${targetSentence} בזמן ירידה במשקל הסיבים חשובים במיוחד כדי למנוע עצירות, לשפר שובע ולשמור על המיקרוביום. ${voice.combineVerb} ירקות, קטניות ודגנים מלאים כמעט בכל ארוחה.`;
      }

      return `${targetSentence} יעד הסיבים שלך מותאם גם לקלוריות וגם לרצפה פיזיולוגית לפי גיל ומגדר, כדי לשמור על עיכול יציב, איזון סוכר ושובע.`;

    case "sodium":
      return `${targetSentence} נתרן הוא מינרל חיוני, אבל אצל רוב המשתמשים האתגר האמיתי הוא לא להגיע מעל 2300 מ"ג ביום. ${voice.tryVerb} לצמצם מזון אולטרה-מעובד, רטבים וחטיפים מלוחים.`;

    case "potassium":
      return `${targetSentence} אשלגן עוזר לאזן את השפעת הנתרן, תומך בלחץ דם תקין ומושפע ממסת הגוף הרזה. ${voice.combineVerb} תפוחי אדמה, קטניות, יוגורט, בננות ועלים ירוקים.`;

    case "magnesium":
      if (gender === "male" && age >= 31) {
        return `${targetSentence} אצל גברים בוגרים יעד המגנזיום עולה ל-420 מ"ג בגלל דרישות מטבוליות ומסת גוף רזה גבוהה יותר. ${voice.combineVerb} אגוזים, זרעים, קקאו וקטניות.`;
      }

      if (gender === "female" && age >= 31) {
        return `${targetSentence} אחרי גיל 31 המערכת מכוונת ל-320 מ"ג ליום כדי לתמוך בפעילות אנזימתית, עצבית ושרירית יציבה. ${voice.combineVerb} שקדים, טופו, קטניות ודגנים מלאים.`;
      }

      return `${targetSentence} מגנזיום משתתף במאות תהליכים מטבוליים כולל אנרגיה, כיווץ שריר ואיזון עצבי. ${voice.combineVerb} מזונות מלאים ועקביים לאורך השבוע.`;

    case "calcium":
      if (gender === "female" && age >= 51 && age <= 70) {
        return `${targetSentence} מכיוון שאת מעל גיל 50, צריכת הסידן שלך קריטית לשמירה על צפיפות העצם בתקופת הירידה באסטרוגן. נסי לשלב יותר מוצרי חלב, טופו, סרדינים או משקאות מועשרים.`;
      }

      if (age >= 71) {
        return `${targetSentence} בגיל מבוגר יותר סידן וויטמין D עובדים יחד כדי להגן על העצם. ${voice.combineVerb} מקורות קבועים של סידן לאורך היום ולא רק בארוחה אחת.`;
      }

      return `${targetSentence} סידן הוא בסיסי לעצמות, לשרירים ולהולכה עצבית. ${voice.combineVerb} לפחות 2-3 מקורות איכותיים ביום כמו יוגורט, טחינה, טופו או ירוקים עשירים.`;

    case "iron":
      if (gender === "female" && age >= 19 && age <= 50) {
        return `${targetSentence} אצל נשים לפני גיל המעבר הצורך בברזל גבוה משמעותית בגלל אובדן דם מחזורי. ${voice.combineVerb} קטניות, בשר רזה או טופו יחד עם מקור לויטמין C לשיפור הספיגה.`;
      }

      if (age >= 51) {
        return `${targetSentence} אחרי גיל 51 יעד הברזל חוזר לרמת בסיס של 8 מ"ג, ולכן אין יתרון בנטילה עודפת ללא צורך רפואי. ${voice.keepVerb} על מקורות מאוזנים והימנע ממנות תוסף אגרסיביות ללא הנחיה.`;
      }

      return `${targetSentence} ברזל תומך בהמוגלובין, באנרגיה ובהובלת חמצן. ${voice.combineVerb} מקורות עשירים לצד ויטמין C כדי לשפר ספיגה.`;

    case "vitaminA":
      return `${targetSentence} ויטמין A מסיס שומן, לכן הוא נספג טוב יותר לצד שומן איכותי. עדיף לקבל אותו ממזון מגוון ולא ממנות תוסף גבוהות בגלל הסיכון לעודף רטינול.`;

    case "vitaminC":
      if (isSmoker) {
        return `${targetSentence} מכיוון שאת${gender === "female" ? "" : "ה"} מעש${gender === "female" ? "נת" : "ן"}, המערכת הוסיפה 35 מ"ג ליעד כדי לפצות על עומס חמצוני גבוה יותר. ${voice.combineVerb} פלפלים, קיווי, תותים והדרים.`;
      }

      return `${targetSentence} ויטמין C חשוב לקולגן, למערכת החיסון וגם לשיפור ספיגת ברזל מהצומח. ${voice.combineVerb} פרי או ירק עשיר בויטמין C ליד ארוחות עיקריות.`;

    case "vitaminD":
      if (age >= 71) {
        return `${targetSentence} מעל גיל 71 יעד ויטמין D עולה כי ייצורו בעור יורד עם הגיל. ${voice.combineVerb} מזונות מועשרים, דגים שומניים וחשיפה מבוקרת לשמש לפי הצורך.`;
      }

      return `${targetSentence} ויטמין D הוא ויטמין מפתח לספיגת סידן ולבריאות העצם. ${voice.combineVerb} אותו יחד עם שומן בארוחה או ממקור מועשר.`;

    case "vitaminE":
      return `${targetSentence} ויטמין E מגן על ממברנות התאים מפני חמצון ונשאר קבוע יחסית לאורך הבגרות. ${voice.combineVerb} אגוזים, זרעים, אבוקדו ושמנים איכותיים.`;

    case "vitaminB12":
      if (age >= 60) {
        return `${targetSentence} מעל גיל 60 הספיגה של B12 ממזון טבעי עלולה לרדת, ולכן עדיף להעדיף מקורות מועשרים או תוסף לפי הצורך. ${voice.combineVerb} מעקב אם יש עייפות, נימול או היסטוריה של חסר.`;
      }

      return `${targetSentence} B12 חיוני ליצירת דם ולתפקוד עצבי. ${voice.combineVerb} דגים, ביצים, מוצרי חלב או מזונות מועשרים אם אינך אוכל מזון מהחי בכמות מספקת.`;

    default:
      return targetSentence;
  }
}
