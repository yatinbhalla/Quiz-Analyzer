import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDocs, 
    query, 
    where, 
    orderBy,
    serverTimestamp,
    deleteDoc
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { AppState, QuizQuestion, UserAnswer, AnalysisReport, ValidationSensitivity } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Login failed:", error);
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed:", error);
    }
};

export interface QuizSessionData {
    id?: string;
    userId: string;
    createdAt: any;
    title: string;
    quizData: QuizQuestion[];
    userAnswers: UserAnswer[];
    analysisReport: AnalysisReport;
    sensitivity: ValidationSensitivity;
}

export const saveQuizSession = async (
    title: string,
    quizData: QuizQuestion[],
    userAnswers: UserAnswer[],
    analysisReport: AnalysisReport,
    sensitivity: ValidationSensitivity
) => {
    if (!auth.currentUser) return;
    const pathForWrite = 'quiz_sessions';
    try {
        const sessionRef = doc(collection(db, pathForWrite));
        await setDoc(sessionRef, {
            userId: auth.currentUser.uid,
            createdAt: serverTimestamp(),
            title,
            quizData,
            userAnswers,
            analysisReport,
            sensitivity
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, pathForWrite);
    }
};

export const getUserSessions = async (): Promise<QuizSessionData[]> => {
    if (!auth.currentUser) return [];
    const pathForList = 'quiz_sessions';
    try {
        const q = query(
            collection(db, pathForList),
            where('userId', '==', auth.currentUser.uid),
            // Wait, we might need an index for orderBy. Usually querying by userId and sorting by createdAt requires a composite index.
            // I'll skip orderBy for now and sort on client-side to avoid index errors.
        );
        const querySnapshot = await getDocs(q);
        const sessions: QuizSessionData[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            sessions.push({
                id: doc.id,
                userId: data.userId,
                createdAt: data.createdAt,
                quizData: data.quizData,
                userAnswers: data.userAnswers,
                analysisReport: data.analysisReport,
                sensitivity: data.sensitivity
            });
        });
        // Client side sort, newest first
        sessions.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
        });
        return sessions;
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, pathForList);
        return [];
    }
};
