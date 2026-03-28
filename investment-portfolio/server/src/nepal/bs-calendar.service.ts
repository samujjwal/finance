import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/** Nepali BS calendar constants — month lengths for BS years 2000-2100.
 *  Array index: [bsYear - 2000][month 0-11]
 *  Authoritative data per Bikram Sambat calendar tables.
 */
const BS_MONTH_DAYS: Record<number, number[]> = {
  2000: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2001: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2002: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2003: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2004: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2005: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2006: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2007: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2008: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2009: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2010: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2011: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2012: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2013: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2014: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2015: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2016: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2017: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2018: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2019: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2020: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2021: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2022: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2023: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2024: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2025: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2026: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2027: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2028: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2029: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2030: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2031: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2032: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2033: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2034: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2035: [30, 32, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2036: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2037: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2038: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2039: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2040: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2041: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2042: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2043: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2044: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2045: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2046: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2047: [31, 31, 31, 32, 31, 31, 30, 29, 29, 30, 30, 30],
  2048: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2049: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2050: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2051: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2052: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2053: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2054: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2055: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2056: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2057: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2058: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2059: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2060: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2061: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2062: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2063: [31, 31, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2064: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2065: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2066: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2067: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2068: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2069: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2070: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2071: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2072: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2073: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2074: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2075: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2076: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2077: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2078: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2079: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2080: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2081: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2082: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2083: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2084: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2085: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2086: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2087: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2088: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2089: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2090: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2091: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2092: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
};

// BS epoch: 1 Baishakh 2000 = 13 April 1943 AD
const BS_EPOCH_AD = new Date(1943, 3, 13); // months are 0-indexed

export interface BsDate {
  year: number;
  month: number; // 1-12
  day: number;
  monthName: string;
}

const BS_MONTH_NAMES = [
  "Baishakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

@Injectable()
export class BsCalendarService {
  constructor(private readonly prisma: PrismaService) {}

  convertADToBS(adDate: Date): BsDate {
    // Days since BS epoch
    const epochMs = new Date(adDate).setHours(0, 0, 0, 0);
    const epochStartMs = new Date(BS_EPOCH_AD).setHours(0, 0, 0, 0);
    let totalDays = Math.round((epochMs - epochStartMs) / 86_400_000);

    let year = 2000;
    while (true) {
      const monthDays = BS_MONTH_DAYS[year];
      if (!monthDays) break;
      const yearDays = monthDays.reduce((s, d) => s + d, 0);
      if (totalDays < yearDays) break;
      totalDays -= yearDays;
      year++;
    }

    const monthDays = BS_MONTH_DAYS[year] ?? BS_MONTH_DAYS[2081];
    let month = 0;
    while (month < 12) {
      if (totalDays < monthDays[month]) break;
      totalDays -= monthDays[month];
      month++;
    }

    return {
      year,
      month: month + 1,
      day: totalDays + 1,
      monthName: BS_MONTH_NAMES[month],
    };
  }

  convertBSToAD(year: number, month: number, day: number): Date {
    const monthDaysTable = BS_MONTH_DAYS[year];
    if (!monthDaysTable)
      throw new Error(`BS year ${year} not in calendar tables`);

    let totalDays = 0;
    for (let y = 2000; y < year; y++) {
      if (!BS_MONTH_DAYS[y]) break;
      totalDays += BS_MONTH_DAYS[y].reduce((s, d) => s + d, 0);
    }
    for (let m = 0; m < month - 1; m++) {
      totalDays += monthDaysTable[m];
    }
    totalDays += day - 1;

    const result = new Date(BS_EPOCH_AD);
    result.setDate(result.getDate() + totalDays);
    return result;
  }

  formatBS(bs: BsDate): string {
    return `${bs.year}-${String(bs.month).padStart(2, "0")}-${String(bs.day).padStart(2, "0")}`;
  }

  /** Determine which Nepal fiscal year (e.g. 2080/81) an AD date falls in. */
  getCurrentFiscalYear(adDate: Date): {
    startAD: Date;
    endAD: Date;
    bsYear: string;
  } {
    const bs = this.convertADToBS(adDate);
    // Nepal FY starts 1 Shrawan (month 4 in BS, i.e. index 3 = July-ish)
    const fyStartMonth = 4; // Shrawan
    let fyStartYear: number;
    if (bs.month >= fyStartMonth) {
      fyStartYear = bs.year;
    } else {
      fyStartYear = bs.year - 1;
    }
    // 1 Shrawan fyStartYear → AD
    const startAD = this.convertBSToAD(fyStartYear, fyStartMonth, 1);
    // Last day of Ashadh (month 3) next BS year → AD
    const endMonth = fyStartMonth - 1; // Ashadh (3)
    const endDay = BS_MONTH_DAYS[fyStartYear + 1]?.[endMonth - 1] ?? 31;
    const endAD = this.convertBSToAD(fyStartYear + 1, endMonth, endDay);
    return {
      startAD,
      endAD,
      bsYear: `${fyStartYear}/${String(fyStartYear + 1).slice(2)}`,
    };
  }

  /** Check if a date is a Nepali public holiday (stored in DB). */
  async isHoliday(adDate: Date): Promise<boolean> {
    const bs = this.convertADToBS(adDate);
    const bsDateString = `${bs.year}-${String(bs.month).padStart(2, "0")}-${String(bs.day).padStart(2, "0")}`;
    const cal = await this.prisma.bsCalendar.findUnique({
      where: { bsDateString },
    });
    return cal?.isHoliday ?? false;
  }

  async getCalendarMonth(bsYear: number, bsMonth: number) {
    const entries = await this.prisma.bsCalendar.findMany({
      where: { bsYear, bsMonth },
      orderBy: { bsDay: "asc" },
    });
    const monthDays = BS_MONTH_DAYS[bsYear]?.[bsMonth - 1] ?? 30;
    // Enrich with AD dates
    return Array.from({ length: monthDays }, (_, i) => {
      const day = i + 1;
      const adDate = this.convertBSToAD(bsYear, bsMonth, day);
      const dbEntry = entries.find((e) => e.bsDay === day);
      return {
        bsDate: { year: bsYear, month: bsMonth, day },
        adDate,
        isHoliday: dbEntry?.isHoliday ?? false,
        event: dbEntry?.holidayName ?? null,
      };
    });
  }
}
