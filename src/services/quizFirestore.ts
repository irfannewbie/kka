import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseAuth';
import type { InteractiveQuiz, QuizAttemptSubmission } from './quizStore';

const QUIZZES_COL = 'quizzes';
const SUBMISSIONS_COL = 'quiz_submissions';

export async function fetchQuizzesFromFirestore(): Promise<InteractiveQuiz[]> {
  try {
    const snap = await getDocs(collection(db, QUIZZES_COL));
    const items: InteractiveQuiz[] = [];
    snap.forEach((d) => {
      items.push({ id: d.id, ...(d.data() as any) } as InteractiveQuiz);
    });
    // Sort by updatedAt desc if exists
    items.sort((a: any, b: any) => {
      const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });
    return items;
  } catch (e) {
    console.warn('Firestore fetchQuizzes error:', e);
    return [];
  }
}

export async function saveQuizToFirestore(quiz: InteractiveQuiz): Promise<void> {
  try {
    const ref = doc(db, QUIZZES_COL, quiz.id);
    await setDoc(ref, { ...quiz, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn('Firestore saveQuiz error:', e);
    throw e;
  }
}

export async function deleteQuizFromFirestore(quizId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, QUIZZES_COL, quizId));
  } catch (e) {
    console.warn('Firestore deleteQuiz error:', e);
    throw e;
  }
}

export async function fetchSubmissionsFromFirestore(filters?: {
  quizId?: string;
  className?: string;
}): Promise<QuizAttemptSubmission[]> {
  try {
    let q: any = collection(db, SUBMISSIONS_COL);
    const constraints: any[] = [];
    if (filters?.quizId) constraints.push(where('quizId', '==', filters.quizId));
    if (filters?.className) constraints.push(where('className', '==', filters.className));
    if (constraints.length > 0) {
      q = query(collection(db, SUBMISSIONS_COL), ...constraints);
    }
    const snap = await getDocs(q);
    const items: QuizAttemptSubmission[] = [];
    snap.forEach((d) => {
      items.push({ id: d.id, ...(d.data() as any) } as QuizAttemptSubmission);
    });
    items.sort((a: any, b: any) => {
      const ta = new Date(a.submittedAt || 0).getTime();
      const tb = new Date(b.submittedAt || 0).getTime();
      return tb - ta;
    });
    return items;
  } catch (e) {
    console.warn('Firestore fetchSubmissions error:', e);
    return [];
  }
}

export async function saveSubmissionToFirestore(submission: QuizAttemptSubmission): Promise<void> {
  try {
    // Use composite key to avoid duplicates
    const key = `${submission.quizId}_${submission.className}_${submission.attendanceNo}`;
    const ref = doc(db, SUBMISSIONS_COL, key);
    await setDoc(ref, { ...submission, syncedToFirestore: true, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.warn('Firestore saveSubmission error:', e);
    throw e;
  }
}

export async function deleteSubmissionFromFirestore(
  quizId: string,
  className: string,
  attendanceNo: number
): Promise<void> {
  try {
    const key = `${quizId}_${className}_${attendanceNo}`;
    await deleteDoc(doc(db, SUBMISSIONS_COL, key));
  } catch (e) {
    console.warn('Firestore deleteSubmission error:', e);
    throw e;
  }
}

export async function getAllQuizzesAndSubmissionsFirestore(): Promise<{
  quizzes: InteractiveQuiz[];
  submissions: QuizAttemptSubmission[];
}> {
  const [quizzes, submissions] = await Promise.all([
    fetchQuizzesFromFirestore(),
    fetchSubmissionsFromFirestore(),
  ]);
  return { quizzes, submissions };
}
