export interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  description?: string
}

export interface Branch {
  id: string
  name: string
  address: string
  phone: string
  lat: number
  lng: number
  hours: string
}

export interface DeliveryCity {
  name: string
  price: number
}

// ============ MENU DATA ============

export const juices: MenuItem[] = [
  { id: "j1", name: "عصير فراولة", price: 8, category: "عصائر" },
  { id: "j2", name: "عصير مانجو", price: 8, category: "عصائر" },
  { id: "j3", name: "كركديه", price: 5, category: "عصائر" },
  { id: "j4", name: "سلطة فواكه", price: 10, category: "عصائر" },
  { id: "j5", name: "عصير برتقال", price: 7, category: "عصائر" },
  { id: "j6", name: "كوكتيل", price: 12, category: "عصائر" },
]

export const libyanDesserts: MenuItem[] = [
  { id: "ld1", name: "كعك حلو", price: 15, category: "حلويات ليبية" },
  { id: "ld2", name: "كعك مالح", price: 15, category: "حلويات ليبية" },
  { id: "ld3", name: "كعك تمر", price: 18, category: "حلويات ليبية" },
  { id: "ld4", name: "بسكويت تمر", price: 12, category: "حلويات ليبية" },
  { id: "ld5", name: "معمول تمر", price: 20, category: "حلويات ليبية" },
  { id: "ld6", name: "لويزة مكسرات", price: 25, category: "حلويات ليبية" },
  { id: "ld7", name: "لويزة شوكولاتة", price: 25, category: "حلويات ليبية" },
  { id: "ld8", name: "غريبة", price: 18, category: "حلويات ليبية" },
  { id: "ld9", name: "مقروض طرابلسي", price: 22, category: "حلويات ليبية" },
  { id: "ld10", name: "بقلاوة طرابلسية", price: 30, category: "حلويات ليبية" },
  { id: "ld11", name: "عنبمبر", price: 20, category: "حلويات ليبية" },
  { id: "ld12", name: "زلابية", price: 15, category: "حلويات ليبية" },
  { id: "ld13", name: "لقيمات", price: 12, category: "حلويات ليبية" },
  { id: "ld14", name: "بقلاوة حشي", price: 28, category: "حلويات ليبية" },
]

export const orientalDesserts: MenuItem[] = [
  { id: "od1", name: "أصابع زينب", price: 15, category: "حلويات شرقية" },
  { id: "od2", name: "كنافة جبن", price: 25, category: "حلويات شرقية" },
  { id: "od3", name: "كنافة نوتيلا", price: 28, category: "حلويات شرقية" },
  { id: "od4", name: "كنافة نابلسية", price: 25, category: "حلويات شرقية" },
  { id: "od5", name: "جولاش بالكاسترد", price: 18, category: "حلويات شرقية" },
  { id: "od6", name: "مشلتت كلاسيك", price: 20, category: "حلويات شرقية" },
  { id: "od7", name: "مشلتت شوكولاتة", price: 22, category: "حلويات شرقية" },
  { id: "od8", name: "مشلتت كريمة", price: 22, category: "حلويات شرقية" },
  { id: "od9", name: "بسبوسة كلاسيك", price: 15, category: "حلويات شرقية" },
  { id: "od10", name: "بسبوسة شوكولاتة", price: 18, category: "حلويات شرقية" },
  { id: "od11", name: "بسبوسة كريمة", price: 18, category: "حلويات شرقية" },
  { id: "od12", name: "بلح الشام", price: 15, category: "حلويات شرقية" },
  { id: "od13", name: "أم علي", price: 20, category: "حلويات شرقية" },
  { id: "od14", name: "قطايف", price: 18, category: "حلويات شرقية" },
]

export const cakes: MenuItem[] = [
  { id: "c1", name: "سان سيباستيان", price: 45, category: "كيك" },
  { id: "c2", name: "تشيز كيك فراولة", price: 40, category: "كيك" },
  { id: "c3", name: "تشيز كيك مانجو", price: 40, category: "كيك" },
  { id: "c4", name: "كيكة برتقال", price: 35, category: "كيك" },
  { id: "c5", name: "كيكة جزر", price: 35, category: "كيك" },
]

export const customTorta: MenuItem[] = [
  { id: "ct1", name: "تورتة فستق", price: 55, category: "تورتة مخصصة", description: "حشوة فستق فاخرة" },
  { id: "ct2", name: "تورتة أوريو", price: 50, category: "تورتة مخصصة", description: "حشوة أوريو كريمية" },
  { id: "ct3", name: "تورتة شوكولاتة", price: 50, category: "تورتة مخصصة", description: "حشوة شوكولاتة غنية" },
  { id: "ct4", name: "تورتة شوكولاتة وكراميل", price: 55, category: "تورتة مخصصة", description: "حشوة شوكولاتة وكراميل" },
]

export const addons = [
  { id: "a1", name: "عسل طبيعي", price: 5, default: true },
  { id: "a2", name: "عسل", price: 3 },
  { id: "a3", name: "شيرة", price: 3 },
]

// ============ EVENTS DATA ============

export const eventCategories = [
  {
    id: "libyan",
    title: "حلويات ليبية",
    items: [
      { id: "ev1", name: "صينية حلويات ليبية صغيرة", price: 80 },
      { id: "ev2", name: "صينية حلويات ليبية وسط", price: 150 },
      { id: "ev3", name: "صينية حلويات ليبية كبيرة", price: 250 },
    ],
  },
  {
    id: "oriental",
    title: "حلويات شرقية",
    items: [
      { id: "ev4", name: "صينية حلويات شرقية صغيرة", price: 80 },
      { id: "ev5", name: "صينية حلويات شرقية وسط", price: 150 },
      { id: "ev6", name: "صينية حلويات شرقية كبيرة", price: 250 },
    ],
  },
  {
    id: "juices",
    title: "عصائر طبيعية",
    items: [
      { id: "ev7", name: "باكج عصائر صغير", price: 60 },
      { id: "ev8", name: "باكج عصائر وسط", price: 120 },
      { id: "ev9", name: "باكج عصائر كبير", price: 200 },
    ],
  },
]

// ============ BRANCHES DATA ============

export const branches: Branch[] = [
  {
    id: "b1",
    name: "فرع النوفليين",
    address: "النوفليين - شارع صحنة الحسناء",
    phone: "0920001171",
    lat: 32.8872,
    lng: 13.1803,
    hours: "10:00 ص - 12:00 م",
  },
  {
    id: "b2",
    name: "فرع سوق الجمعة",
    address: "سوق الجمعة - مركز الشرطة",
    phone: "0925006674",
    lat: 32.9017,
    lng: 13.1569,
    hours: "10:00 ص - 12:00 م",
  },
  {
    id: "b3",
    name: "فرع السراج",
    address: "السراج - بجانب مماش",
    phone: "0922777878",
    lat: 32.8534,
    lng: 13.0357,
    hours: "10:00 ص - 12:00 م",
  },
]

// ============ DELIVERY CITIES ============

export const deliveryCities: DeliveryCity[] = [
  { name: "طرابلس", price: 10 },
  { name: "مصراتة", price: 25 },
  { name: "الخمس", price: 20 },
  { name: "درنة", price: 40 },
  { name: "صبراتة", price: 15 },
  { name: "الزاوية", price: 15 },
  { name: "بنغازي", price: 35 },
]

// ============ MENU CATEGORIES ============

export const menuCategories = [
  { id: "juices", label: "عصائر", items: juices },
  { id: "libyan", label: "حلويات ليبية", items: libyanDesserts },
  { id: "oriental", label: "حلويات شرقية", items: orientalDesserts },
  { id: "cakes", label: "كيك", items: cakes },
  { id: "torta", label: "تورتة مخصصة", items: customTorta },
]
