export function getZodiacSign(dateStr: string): string {
  // expects DD/MM/YYYY
  const parts = dateStr.split("/");
  if (parts.length < 2) return "";
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (!day || !month) return "";
  const signs: { name: string; from: [number, number]; to: [number, number] }[] = [
    { name: "Capricorne", from: [12, 22], to: [1, 19] },
    { name: "Verseau", from: [1, 20], to: [2, 18] },
    { name: "Poissons", from: [2, 19], to: [3, 20] },
    { name: "Bélier", from: [3, 21], to: [4, 19] },
    { name: "Taureau", from: [4, 20], to: [5, 20] },
    { name: "Gémeaux", from: [5, 21], to: [6, 20] },
    { name: "Cancer", from: [6, 21], to: [7, 22] },
    { name: "Lion", from: [7, 23], to: [8, 22] },
    { name: "Vierge", from: [8, 23], to: [9, 22] },
    { name: "Balance", from: [9, 23], to: [10, 22] },
    { name: "Scorpion", from: [10, 23], to: [11, 21] },
    { name: "Sagittaire", from: [11, 22], to: [12, 21] },
  ];
  for (const s of signs) {
    const [fm, fd] = s.from;
    const [tm, td] = s.to;
    if (fm === tm) {
      if (month === fm && day >= fd && day <= td) return s.name;
    } else {
      if ((month === fm && day >= fd) || (month === tm && day <= td)) return s.name;
    }
  }
  return "Capricorne";
}
