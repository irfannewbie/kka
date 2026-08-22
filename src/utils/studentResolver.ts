import { Student, TaskSubmission } from '../types';
import { ALL_255_STUDENTS } from '../data/students255';

// Helper to normalize class string (e.g. "Kelas 8A" -> "8A", "8-A" -> "8A", "VIII A" -> "8A")
export function normalizeClass(c?: string): string {
  if (!c) return '8A';
  const clean = c
    .toUpperCase()
    .replace(/^KELAS\s*/i, '')
    .replace(/^VIII\s*/i, '8')
    .replace(/[^0-9A-Z]/g, '');
  return clean || '8A';
}

export interface ResolvedMember {
  attendanceNo: string;
  name: string;
  nis?: string;
}

export interface ParsedSubmissionLinks {
  title: string;
  groupName: string;
  className: string;
  members: ResolvedMember[];
  attendanceNumbersText: string;
  linkYt: string;
  linkWeb: string;
  linkCanva: string;
  linkPdf: string;
  rawDescription: string;
}

// Build authentic lookup map for all 255 students by class and attendance number
const AUTHENTIC_CLASS_ROSTER: Record<string, Record<string, { name: string; nis: string }>> = {};

ALL_255_STUDENTS.forEach((std) => {
  const normCls = normalizeClass(std.className);
  if (!AUTHENTIC_CLASS_ROSTER[normCls]) {
    AUTHENTIC_CLASS_ROSTER[normCls] = {};
  }
  const att = String(std.attendanceNo || '').trim();
  if (att) {
    AUTHENTIC_CLASS_ROSTER[normCls][att] = {
      name: std.name,
      nis: std.nis,
    };
  }
});

export function resolveStudentByAttendance(
  attNo: string,
  className: string,
  students: Student[]
): ResolvedMember {
  const normCls = normalizeClass(className);
  const cleanAtt = String(attNo).trim().replace(/^0+/, '');

  // 1. Search in passed students list
  const found = students.find((s) => {
    const sNormCls = normalizeClass(s.className);
    const sAtt = String(s.attendanceNo || '').trim().replace(/^0+/, '');
    const sNameUpper = (s.name || '').toUpperCase();
    const isValidName =
      s.name &&
      !sNameUpper.includes('ASPEK') &&
      !sNameUpper.includes('NAMA SISWA') &&
      !sNameUpper.includes('DAFTAR NILAI');
    return sNormCls === normCls && sAtt === cleanAtt && isValidName;
  });

  if (found) {
    return {
      attendanceNo: cleanAtt,
      name: found.name,
      nis: found.nis,
    };
  }

  // 2. Search in authentic 255 students database
  const rosterForClass = AUTHENTIC_CLASS_ROSTER[normCls];
  if (rosterForClass && rosterForClass[cleanAtt]) {
    return {
      attendanceNo: cleanAtt,
      name: rosterForClass[cleanAtt].name,
      nis: rosterForClass[cleanAtt].nis,
    };
  }

  // 3. Fallback
  return {
    attendanceNo: cleanAtt,
    name: `Siswa Absen ${cleanAtt} (${className})`,
  };
}

// Primary Parser for Task Submissions
export const ORDERED_CLASSES = ['8A', '8B', '8C', '8D', '8E', '8F', '8G', '8H'];

// Helper to normalize Roman numerals and Indonesian words into a group digit
export function normalizeGroupDigit(val: string): number | null {
  if (!val) return null;
  const clean = val.trim().toLowerCase();

  // Direct integer
  const numMatch = clean.match(/^\d+$/);
  if (numMatch) {
    const n = parseInt(numMatch[0], 10);
    if (n >= 1 && n <= 16) return n;
  }

  // Roman numerals
  const romanMap: Record<string, number> = {
    i: 1,
    ii: 2,
    iii: 3,
    iv: 4,
    v: 5,
    vi: 6,
    vii: 7,
    viii: 8,
    ix: 9,
    x: 10,
    xi: 11,
    xii: 12,
  };
  if (romanMap[clean] !== undefined) return romanMap[clean];

  // Indonesian words
  const wordMap: Record<string, number> = {
    satu: 1,
    dua: 2,
    tiga: 3,
    empat: 4,
    lima: 5,
    enam: 6,
    tujuh: 7,
    delapan: 8,
    sembilan: 9,
    sepuluh: 10,
    sebelas: 11,
    'dua belas': 12,
  };
  if (wordMap[clean] !== undefined) return wordMap[clean];

  return null;
}

const INVALID_GROUP_WORDS = [
  'tutor',
  'belajar',
  'kerja',
  'diskusi',
  'kami',
  'web',
  'aplikasi',
  'projek',
  'project',
  'sekolah',
  'mandiri',
  'sebaya',
  'siswa',
  'online',
  'desa',
  'digital',
];

export function resolveTaskGroupNumber(
  task: TaskSubmission,
  rawDesc: string,
  resolvedClass: string,
  students: Student[],
  attendanceNumbers: string[] = []
): string {
  const normalizedCls = normalizeClass(resolvedClass);
  const combinedRoster = [...students, ...ALL_255_STUDENTS].filter(
    (s) => normalizeClass(s.className) === normalizedCls
  );

  // 1. HIGHEST PRIORITY: Explicit valid group in task.group (e.g. "Kelompok 5", "Kelompok 1", "Kelompok 8", "Kelompok VIII")
  if (task.group) {
    const cleanGrp = task.group.trim();
    
    // Ignore if task.group is just the class name like "8H", "Kelas 8H", "Kelompok 8H" or invalid words like "Kelompok tutor"
    const isJustClassName = /^(\s*Kelas\s*)?8[A-Ha-h]\s*$/i.test(cleanGrp) || /^Kelompok\s*8[A-Ha-h]\s*$/i.test(cleanGrp);
    if (!isJustClassName) {
      const grpNumMatch = cleanGrp.match(/(?:Kelompok|Klp|Group|Grup)\s*[:=\s#\-]*([0-9]+|[a-zA-Z]+)/i);
      if (grpNumMatch) {
        const candidate = grpNumMatch[1];
        if (!INVALID_GROUP_WORDS.includes(candidate.toLowerCase()) && !/^8[A-Ha-h]$/i.test(candidate)) {
          const digit = normalizeGroupDigit(candidate);
          if (digit !== null) {
            return `Kelompok ${digit}`;
          }
        }
      }

      const justNum = cleanGrp.match(/^\d+$/);
      if (justNum) {
        const digit = normalizeGroupDigit(justNum[0]);
        if (digit !== null) return `Kelompok ${digit}`;
      }
    }
  }

  // 2. Explicit group in rawDesc (e.g. "Kelompok : 5" or "Kelompok 5")
  const descGroupMatches = rawDesc.matchAll(
    /(?:Kelompok|Klp|Group|Grup)\s*[:=\s#\-]*([0-9]+|[IVXLCDMivxlcdm]+|\b(?:satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh)\b)/gi
  );
  for (const match of descGroupMatches) {
    const candidate = match[1];
    if (candidate && !INVALID_GROUP_WORDS.includes(candidate.toLowerCase()) && !/^8[A-Ha-h]$/i.test(candidate)) {
      const digit = normalizeGroupDigit(candidate);
      if (digit !== null) {
        return `Kelompok ${digit}`;
      }
    }
  }

  // Helper to find group from roster via attendance numbers
  const getGroupByAttendance = (): string | null => {
    if (attendanceNumbers.length === 0) return null;
    const matchedGroups: string[] = [];
    attendanceNumbers.forEach((attNo) => {
      const std = combinedRoster.find(
        (s) => String(s.attendanceNo || '').trim().replace(/^0+/, '') === attNo
      );
      if (std?.group && /Kelompok\s*\d+/i.test(std.group)) {
        matchedGroups.push(std.group);
      }
    });

    if (matchedGroups.length > 0) {
      const freq: Record<string, number> = {};
      matchedGroups.forEach((g) => {
        freq[g] = (freq[g] || 0) + 1;
      });
      return Object.keys(freq).reduce((a, b) => (freq[a] >= freq[b] ? a : b));
    }
    return null;
  };

  // Helper to find group from roster via student names
  const getGroupByStudentNames = (): string | null => {
    if (!task.studentName) return null;
    const rawNames = task.studentName
      .split(/[,;\n]/)
      .map((n) => n.replace(/\(.*?\)/g, '').trim())
      .filter(Boolean);
    const matchedGroups: string[] = [];
    for (const name of rawNames) {
      if (name.length < 3 || name.toUpperCase().includes('ASPEK')) continue;
      const std = combinedRoster.find(
        (s) =>
          s.name &&
          (s.name.toUpperCase().includes(name.toUpperCase()) ||
            name.toUpperCase().includes(s.name.toUpperCase()))
      );
      if (std?.group && /Kelompok\s*\d+/i.test(std.group)) {
        matchedGroups.push(std.group);
      }
    }
    if (matchedGroups.length > 0) {
      const freq: Record<string, number> = {};
      matchedGroups.forEach((g) => {
        freq[g] = (freq[g] || 0) + 1;
      });
      return Object.keys(freq).reduce((a, b) => (freq[a] >= freq[b] ? a : b));
    }
    return null;
  };

  // 3. Signature check for invalid "Kelompok tutor" in task.group (specifically in 8D or general)
  if (task.group && /tutor/i.test(task.group)) {
    if (normalizedCls === '8D') {
      return 'Kelompok 8';
    }
    const fromAtt = getGroupByAttendance();
    if (fromAtt) return fromAtt;
    const fromNames = getGroupByStudentNames();
    if (fromNames) return fromNames;
    return 'Kelompok 8';
  }

  // 4. Cross-reference attendance numbers with authentic roster
  const rosterGroupByAtt = getGroupByAttendance();
  if (rosterGroupByAtt) {
    return rosterGroupByAtt;
  }

  // 5. Explicit group in taskTitle (only if strictly numeric and not a title keyword)
  if (task.taskTitle) {
    const titleGroupMatches = task.taskTitle.matchAll(
      /(?:Kelompok|Klp|Group|Grup)\s*[:=\s#\-]*([0-9]+|[IVXLCDMivxlcdm]+|\b(?:satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh)\b)/gi
    );
    for (const match of titleGroupMatches) {
      const candidate = match[1];
      if (candidate && !INVALID_GROUP_WORDS.includes(candidate.toLowerCase()) && !/^8[A-Ha-h]$/i.test(candidate)) {
        const digit = normalizeGroupDigit(candidate);
        if (digit !== null) {
          return `Kelompok ${digit}`;
        }
      }
    }
  }

  // 6. Cross-reference student names in roster
  const rosterGroupByNames = getGroupByStudentNames();
  if (rosterGroupByNames) {
    return rosterGroupByNames;
  }

  return 'Kelompok 1';
}

export function getTaskClassAndGroupRank(task: TaskSubmission, students: Student[] = []) {
  const parsed = parseSubmissionDetails(task, students);
  const normCls = normalizeClass(parsed.className);

  let classRank = ORDERED_CLASSES.indexOf(normCls);
  if (classRank === -1) {
    const match = normCls.match(/8[A-H]/i);
    classRank = match ? ORDERED_CLASSES.indexOf(match[0].toUpperCase()) : 999;
  }
  if (classRank === -1) classRank = 999;

  // Extract group integer: "Kelompok 1" -> 1, "Kelompok 5" -> 5
  const groupMatch = parsed.groupName.match(/\d+/);
  const groupRank = groupMatch ? parseInt(groupMatch[0], 10) : 999;

  return {
    classRank,
    groupRank,
    className: parsed.className,
    groupName: parsed.groupName,
    title: parsed.title,
  };
}

export function sortTasksByClassAndGroup(
  tasks: TaskSubmission[],
  students: Student[] = []
): TaskSubmission[] {
  return [...tasks].sort((a, b) => {
    const rankA = getTaskClassAndGroupRank(a, students);
    const rankB = getTaskClassAndGroupRank(b, students);

    // 1. Sort by Class (8A, 8B, 8C, 8D, 8E, 8F, 8G, 8H)
    if (rankA.classRank !== rankB.classRank) {
      return rankA.classRank - rankB.classRank;
    }

    // 2. Sort by Group Number (Kelompok 1, Kelompok 2, Kelompok 3, ...)
    if (rankA.groupRank !== rankB.groupRank) {
      return rankA.groupRank - rankB.groupRank;
    }

    // 3. Fallback: Group Name String Comparison
    if (rankA.groupName !== rankB.groupName) {
      return rankA.groupName.localeCompare(rankB.groupName, undefined, { numeric: true });
    }

    // 4. Fallback: Title or Student Name
    return (a.taskTitle || a.studentName || '').localeCompare(
      b.taskTitle || b.studentName || ''
    );
  });
}

export function parseSubmissionDetails(
  task: TaskSubmission,
  students: Student[]
): ParsedSubmissionLinks {
  const rawDesc = task.descriptionOrLink || '';

  // 1. Resolve Class
  let resolvedClass = task.className || '';
  const classMatchInDesc = rawDesc.match(/Kelas\s*[:=\s]*([0-9A-Za-z]+)/i);
  if (classMatchInDesc) {
    resolvedClass = `Kelas ${classMatchInDesc[1].toUpperCase()}`;
  } else if (rawDesc.match(/\b8[A-Ha-h]\b/i)) {
    resolvedClass = `Kelas ${rawDesc.match(/\b8[A-Ha-h]\b/i)![0].toUpperCase()}`;
  } else if (task.group && task.group.match(/8[A-Ha-h]/i)) {
    const m = task.group.match(/8[A-Ha-h]/i);
    if (m) resolvedClass = `Kelas ${m[0].toUpperCase()}`;
  } else if (task.taskTitle && task.taskTitle.match(/8[A-Ha-h]/i)) {
    const m = task.taskTitle.match(/8[A-Ha-h]/i);
    if (m) resolvedClass = `Kelas ${m[0].toUpperCase()}`;
  } else if (!resolvedClass && task.studentName) {
    // Search student in authentic roster or students props by name
    const rawNames = task.studentName
      .split(/[,;\n]/)
      .map((n) => n.replace(/\(.*?\)/g, '').trim())
      .filter(Boolean);
    const combinedList = [...students, ...ALL_255_STUDENTS];
    for (const name of rawNames) {
      if (name.toUpperCase().includes('ASPEK') || name.length < 3) continue;
      const foundStudent = combinedList.find(
        (s) =>
          s.name.toUpperCase().includes(name.toUpperCase()) ||
          name.toUpperCase().includes(s.name.toUpperCase())
      );
      if (foundStudent && foundStudent.className) {
        resolvedClass = foundStudent.className;
        break;
      }
    }
  }

  if (!resolvedClass) {
    resolvedClass = 'Kelas 8A';
  }
  const normalizedCls = normalizeClass(resolvedClass);

  // 2. Extract Attendance Numbers early to assist group resolution
  const attendanceNumbers: string[] = [];

  // Check explicit group members array first
  if (task.groupMembers && task.groupMembers.length > 0) {
    task.groupMembers.forEach((m) => {
      if (m.attendanceNo) {
        const cleaned = String(m.attendanceNo).trim().replace(/^0+/, '');
        if (cleaned && !attendanceNumbers.includes(cleaned)) {
          attendanceNumbers.push(cleaned);
        }
      }
    });
  }

  // Check description for "Absen : 3, 13, 23, 27" or "Absen: 1, 20, 17"
  const absenMatch = rawDesc.match(/Absen\s*[:=\s]*([^\n\r]+)/i);
  if (absenMatch && absenMatch[1]) {
    const rawAbsenLine = absenMatch[1];
    const extracted = rawAbsenLine.match(/\b\d+\b/g);
    if (extracted) {
      extracted.forEach((num) => {
        const cleanNum = String(parseInt(num, 10));
        if (cleanNum && !attendanceNumbers.includes(cleanNum)) {
          attendanceNumbers.push(cleanNum);
        }
      });
    }
  }

  // Check task.attendanceNo field
  if (task.attendanceNo && attendanceNumbers.length === 0) {
    const extracted = String(task.attendanceNo).match(/\b\d+\b/g);
    if (extracted) {
      extracted.forEach((num) => {
        const cleanNum = String(parseInt(num, 10));
        if (cleanNum && !attendanceNumbers.includes(cleanNum)) {
          attendanceNumbers.push(cleanNum);
        }
      });
    }
  }

  // Check task.studentName field for numbers like (No. 3) or (No.1)
  if (attendanceNumbers.length === 0 && task.studentName) {
    const matchedParenNums = task.studentName.match(/(?:No\.?|Absen\s*)?\s*(\d+)/gi);
    if (matchedParenNums) {
      matchedParenNums.forEach((str) => {
        const digits = str.match(/\d+/);
        if (digits) {
          const cleanNum = String(parseInt(digits[0], 10));
          if (!attendanceNumbers.includes(cleanNum)) {
            attendanceNumbers.push(cleanNum);
          }
        }
      });
    }
  }

  // 3. Resolve Group accurately across all classes
  const groupName = resolveTaskGroupNumber(
    task,
    rawDesc,
    resolvedClass,
    students,
    attendanceNumbers
  );

  // 4. Extract Links
  let linkYt = '';
  let linkWeb = '';
  let linkCanva = '';
  let linkPdf = '';

  const ytMatch = rawDesc.match(/(?:Link\s*yt|Youtube|YouTube)\s*[:=\s]*([^\n\r]+)/i);
  if (ytMatch && ytMatch[1] && ytMatch[1].trim() !== '-' && ytMatch[1].trim() !== '—') {
    const url = ytMatch[1].trim().match(/https?:\/\/[^\s]+/i);
    if (url) linkYt = url[0];
  }

  const webMatch = rawDesc.match(/(?:Link\s*web|Web|Website)\s*[:=\s]*([^\n\r]+)/i);
  if (webMatch && webMatch[1] && webMatch[1].trim() !== '-' && webMatch[1].trim() !== '—') {
    const url = webMatch[1].trim().match(/https?:\/\/[^\s]+/i);
    if (url) linkWeb = url[0];
  }

  const canvaMatch = rawDesc.match(/(?:Link\s*canva|Canva)\s*[:=\s]*([^\n\r]+)/i);
  if (canvaMatch && canvaMatch[1] && canvaMatch[1].trim() !== '-' && canvaMatch[1].trim() !== '—') {
    const url = canvaMatch[1].trim().match(/https?:\/\/[^\s]+/i);
    if (url) linkCanva = url[0];
  }

  const pdfMatch = rawDesc.match(/(?:Pdf|PDF|Link\s*pdf|Dokumen|Drive)\s*[:=\s]*([^\n\r]+)/i);
  if (pdfMatch && pdfMatch[1] && pdfMatch[1].trim() !== '-' && pdfMatch[1].trim() !== '—') {
    const url = pdfMatch[1].trim().match(/https?:\/\/[^\s]+/i);
    if (url) linkPdf = url[0];
  }

  // Fallback direct URL extract if specific labels were not used
  const allUrls = rawDesc.match(/https?:\/\/[^\s]+/gi) || [];
  allUrls.forEach((url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      if (!linkYt) linkYt = url;
    } else if (url.includes('canva.com')) {
      if (!linkCanva) linkCanva = url;
    } else if (url.includes('drive.google.com') || url.toLowerCase().includes('.pdf')) {
      if (!linkPdf) linkPdf = url;
    } else if (
      url.includes('netlify.app') ||
      url.includes('vercel.app') ||
      url.includes('github.io') ||
      url.includes('.site') ||
      url.includes('.me') ||
      url.includes('glitch.me') ||
      url.includes('surge.sh')
    ) {
      if (!linkWeb) linkWeb = url;
    } else if (!linkWeb) {
      linkWeb = url;
    }
  });

  // Default demo link if none provided
  if (!linkWeb && !linkPdf && !linkYt && !linkCanva) {
    linkWeb = 'https://kantin-mesya.netlify.app/';
  }

  // 5. Build Member list by matching Attendance Numbers with authentic Student database
  const members: ResolvedMember[] = [];
  const combinedStudentsList = [...students, ...ALL_255_STUDENTS];

  if (attendanceNumbers.length > 0) {
    attendanceNumbers.forEach((attNo) => {
      // Find in passed student database
      const foundInProps = combinedStudentsList.find((s) => {
        const sClassNorm = normalizeClass(s.className);
        const sAtt = String(s.attendanceNo || '').trim().replace(/^0+/, '');
        const isValid = s.name && !s.name.toUpperCase().includes('ASPEK') && !s.name.toUpperCase().includes('NAMA SISWA');
        return sClassNorm === normalizedCls && sAtt === attNo && isValid;
      });

      if (foundInProps) {
        members.push({
          attendanceNo: attNo,
          name: foundInProps.name,
          nis: foundInProps.nis,
        });
        return;
      }

      // Check authentic class roster
      const rosterForClass = AUTHENTIC_CLASS_ROSTER[normalizedCls];
      if (rosterForClass && rosterForClass[attNo]) {
        members.push({
          attendanceNo: attNo,
          name: rosterForClass[attNo].name,
          nis: rosterForClass[attNo].nis,
        });
        return;
      }

      // Fallback
      members.push({
        attendanceNo: attNo,
        name: `Siswa Absen ${attNo} (${resolvedClass})`,
      });
    });
  } else if (task.studentName) {
    // Single student or comma separated names
    const parts = task.studentName.split(/[,;\n]/).map((p) => p.trim()).filter(Boolean);
    parts.forEach((p, idx) => {
      const numMatch = p.match(/\b\d+\b/);
      const att = numMatch ? String(parseInt(numMatch[0], 10)) : String(idx + 1);
      let cleanName = p.replace(/\(?(?:No\.?|Absen)?\s*\d+\)?/gi, '').trim() || p;
      if (cleanName.toUpperCase().includes('ASPEK')) {
        const rosterForClass = AUTHENTIC_CLASS_ROSTER[normalizedCls];
        if (rosterForClass && rosterForClass[att]) {
          cleanName = rosterForClass[att].name;
        }
      }
      members.push({
        attendanceNo: att,
        name: cleanName,
        nis: task.studentNis,
      });
    });
  }

  const attendanceNumbersText =
    attendanceNumbers.length > 0
      ? attendanceNumbers.join(', ')
      : members.map((m) => m.attendanceNo).filter(Boolean).join(', ') || '-';

  // 6. Resolve Title
  let title = task.taskTitle || 'Tugas Proyek Siswa';
  if (title.toLowerCase() === 'tugas' || title.toLowerCase() === 'proyek' || title.toLowerCase() === 'tugas_siswa') {
    if (linkWeb && linkWeb.includes('leafy-marigold')) {
      title = 'Website Pre-Order Kantin Digital';
    } else if (linkWeb && linkWeb.includes('kantin-mesya')) {
      title = 'Pemesanan Kantin Sekolah Pre-Order';
    } else if (linkWeb) {
      title = `Proyek Web Aplikasi ${groupName}`;
    }
  }

  return {
    title,
    groupName,
    className: resolvedClass,
    members,
    attendanceNumbersText,
    linkYt,
    linkWeb,
    linkCanva,
    linkPdf,
    rawDescription: rawDesc,
  };
}
