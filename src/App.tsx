import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  DEFAULT_ADMIN_USER,
  ADMIN_PROFILES,
  ADMIN_EMAILS,
  getAuthErrorMessage,
  getSavedAccessToken,
  getSessionTimerInfo,
  getTokenExpiryTime,
  saveAccessToken,
  SessionTimerInfo,
  signInWithCustomEmail,
} from './services/firebaseAuth';
import {
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_SPREADSHEET_URL,
  INITIAL_STUDENTS_MOCK,
  INITIAL_TASKS_MOCK,
  loadSpreadsheetData,
  syncNewTaskToSheet,
  syncAllTasksToSheet,
  syncAllStudentsToSheet,
  fetchCalculatorBreakdownFromSheet,
  syncCalculatorBreakdownToSheet,
} from './services/sheetsService';
import { playNotificationChime } from './services/sound';
import { syncAllCalculatorMasterWithServer } from './services/calculatorMasterStore';
import { Student, TaskSubmission, AppNotification } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ShowcaseView } from './components/ShowcaseView';
import { MasterDataView } from './components/MasterDataView';
import { TaskListView } from './components/TaskListView';
import { StudentManagerView } from './components/StudentManagerView';
import { GradeMappingView } from './components/GradeMappingView';
import { AcademicCalculatorView } from './components/AcademicCalculatorView';
import { SpreadsheetIframeView } from './components/SpreadsheetIframeView';
import { StudentCheckView } from './components/StudentCheckView';
import { SubstituteTaskView } from './components/SubstituteTaskView';
import { MasterSubstituteTaskView } from './components/MasterSubstituteTaskView';
import { TaskSubmissionModal } from './components/TaskSubmissionModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { ConfirmationModal } from './components/ConfirmationModal';
import { SessionCountdownPanel } from './components/SessionCountdownPanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import { StudentQuizView } from './components/StudentQuizView';
import { MasterQuizManagerView } from './components/MasterQuizManagerView';
import { ExcelLabStudentWorkspace } from './components/excel/ExcelLabStudentWorkspace';
import { ExcelLabMasterView } from './components/excel/ExcelLabMasterView';
import { Kelas7HubView } from './components/Kelas7HubView';
import { MateriView } from './components/MateriView';
import { PraktekView } from './components/praktek/PraktekView';
import {
  Bell,
  X,
} from 'lucide-react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { TabId, getTabFromPath, isPublicTab, resolveTabPath } from './routes/navigation';


const STORAGE_KEYS = {
  TASKS: 'tugas_siswa_tasks_v3',
  STUDENTS: 'tugas_siswa_students_v4',
  NOTIFICATIONS: 'tugas_siswa_notifs_v3',
  SOUND: 'tugas_siswa_sound_enabled',
  ACTIVE_ADMIN: 'tugas_siswa_active_admin_email_v3',
};

// Clear any stale cached data
try {
  localStorage.removeItem('tugas_siswa_tasks_v1');
  localStorage.removeItem('tugas_siswa_students_v1');
  localStorage.removeItem('tugas_siswa_grades_v1');
  localStorage.removeItem('tugas_siswa_tasks_v2');
  localStorage.removeItem('tugas_siswa_students_v2');
  localStorage.removeItem('tugas_siswa_students_v3');
  localStorage.removeItem('tugas_siswa_grades_v2');
  localStorage.removeItem('tugas_siswa_grades_v3');
} catch (e) {
  // ignore
}

export default function App() {
  // Routing ditangani React Router: tab aktif diturunkan dari URL saat ini.
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab: TabId = getTabFromPath(location.pathname);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Programmatic navigation — URL & history dikelola React Router
  const handleNavigate = (tab: TabId, targetPath?: string) => {
    const effectiveTab = tab === 'excel' ? 'materi' : tab;
    const resolvedPath = resolveTabPath(tab, targetPath);
    if (location.pathname !== resolvedPath) {
      navigate(resolvedPath);
    }
    return effectiveTab;
  };

  /** Buka Ruang Praktik (/praktek) dengan alat & sub-tab tertentu. */
  const handleOpenPraktek = (tool?: string, view?: string) => {
    const params = new URLSearchParams();
    if (tool) params.set('tool', tool);
    if (view) params.set('view', view);
    const query = params.toString();
    handleNavigate('praktek', `/praktek${query ? `?${query}` : ''}`);
  };

  // Auth & Google Sheets State - Default logged in as irfandwi.hs@gmail.com / irfannewbie7@gmail.com
  const [user, setUser] = useState<User | null>(() => {
    const savedEmail = localStorage.getItem(STORAGE_KEYS.ACTIVE_ADMIN);
    if (savedEmail) {
      const found = Object.keys(ADMIN_PROFILES).find((k) => k.toLowerCase() === savedEmail.toLowerCase());
      if (found) return ADMIN_PROFILES[found];
    }
    return ADMIN_PROFILES['irfandwi.hs@gmail.com'] || ADMIN_PROFILES['irfannewbie7@gmail.com'] || DEFAULT_ADMIN_USER;
  });
  const [token, setToken] = useState<string | null>(() => getSavedAccessToken());
  const [sessionInfo, setSessionInfo] = useState<SessionTimerInfo>(() =>
    getSessionTimerInfo(getSavedAccessToken())
  );
  const [masterOpenSeconds, setMasterOpenSeconds] = useState<number>(0);
  const masterMountTimeRef = useRef<number>(Date.now());
  const warned5MinRef = useRef<boolean>(false);
  const warned1MinRef = useRef<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [spreadsheetId] = useState<string>(DEFAULT_SPREADSHEET_ID);
  const [spreadsheetUrl] = useState<string>(DEFAULT_SPREADSHEET_URL);

  // Switch antara profil admin yang sudah terotorisasi (tanpa perlu password).
  const handleSwitchAdminProfile = (email: string) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;
    const allowed = ADMIN_EMAILS.map((e) => e.toLowerCase());
    if (!allowed.includes(normalized)) {
      triggerNewTaskAlert('Akses Ditolak', `Email ${email} tidak diizinkan untuk login sebagai admin.`);
      return;
    }
    const finalEmail = Object.keys(ADMIN_PROFILES).find((k) => k.toLowerCase() === normalized) || email;
    const profile = ADMIN_PROFILES[finalEmail] || ({
      ...DEFAULT_ADMIN_USER,
      email: finalEmail,
      displayName: finalEmail.split('@')[0],
    } as User);
    setUser(profile);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ADMIN, finalEmail);
    triggerNewTaskAlert('Profil Admin Aktif', `Akun admin beralih ke: ${finalEmail}`);
  };

  // Login aman dengan email + password Firebase (mis. admin@ifkka.com).
  const handleAdminEmailLogin = (email: string) => {
    handleSwitchAdminProfile(email);
    setSessionInfo(getSessionTimerInfo(token));
    triggerNewTaskAlert('Login Admin Berhasil', `Selamat datang, ${email}.`);
  };

  // Sound preference
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
    return saved !== null ? saved === 'true' : true;
  });

  // Main Data States (Initialized with authentic school dataset and continuously synced with Google Sheets)
  const [tasks, setTasks] = useState<TaskSubmission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy mock tasks
          const realTasks = parsed.filter(
            (t) =>
              !t.id?.startsWith('tsk-8d-') &&
              !t.id?.startsWith('tsk-8a-') &&
              !t.id?.startsWith('tsk-8b-') &&
              !t.id?.startsWith('tsk-8c-') &&
              !t.id?.startsWith('tsk-8h-')
          );
          return realTasks;
        }
      } catch (e) {
        // use fallback
      }
    }
    return [];
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 350) return parsed;
      } catch (e) {
        // use fallback
      }
    }
    return INITIAL_STUDENTS_MOCK;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'notif-1',
            title: 'Sistem Terhubung ke Spreadsheet',
            message: 'Aplikasi membaca basis data dari Google Spreadsheet Anda.',
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            type: 'info',
            read: false,
          },
        ];
  });

  // Active Toast Alert for new tasks
  const [toastAlert, setToastAlert] = useState<{ title: string; message: string; taskId?: string } | null>(null);

  // Destructive Confirmation Modal
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Track previous tasks length for detecting new incoming tasks
  const prevTasksCount = useRef<number>(tasks.length);

  // Fetch initial spreadsheet data upon application mount (even before login)
  useEffect(() => {
    syncAllCalculatorMasterWithServer().catch(() => {
      // ignore
    });
    fetchCalculatorBreakdownFromSheet(spreadsheetId, true).catch(() => {
      // ignore
    });
    async function fetchInitialData() {
      try {
        const remoteData = await loadSpreadsheetData(null, spreadsheetId);
        setStudents(remoteData.students || []);
        setTasks(remoteData.tasks || []);
        prevTasksCount.current = (remoteData.tasks || []).length;
        const now = new Date();
        setLastSyncedAt(`${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`);
      } catch (err) {
        console.warn('Initial spreadsheet fetch failed:', err);
      }
    }
    fetchInitialData();
  }, [spreadsheetId]);

  // Initialize Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      async (authenticatedUser, accessToken) => {
        setUser(authenticatedUser);
        setToken(accessToken);
        // Automatically sync from Google Sheet upon successful auth
        performSyncWithSheet(accessToken, false);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SOUND, soundEnabled.toString());
  }, [soundEnabled]);

  // Periodic Auto-Sync
  useEffect(() => {
    const intervalId = setInterval(() => {
      performSyncWithSheet(token, true);
    }, 25000); // Check every 25s

    return () => clearInterval(intervalId);
  }, [token, spreadsheetId]);

  // Live 1-Second Session Countdown Ticker & Expiry Monitor
  useEffect(() => {
    if (token && !getTokenExpiryTime()) {
      saveAccessToken(token);
    }
    const updateTimers = () => {
      setMasterOpenSeconds(Math.max(0, Math.floor((Date.now() - masterMountTimeRef.current) / 1000)));
      const info = getSessionTimerInfo(token);
      setSessionInfo(info);

      if (token) {
        if (!info.isActive || info.remainingSeconds <= 0) {
          setToken(null);
          warned5MinRef.current = false;
          warned1MinRef.current = false;
          triggerNewTaskAlert(
            'Waktu Sesi Google Habis (00:00)',
            'Sesi 60 menit Anda telah berakhir. Klik "MULAI SESI GOOGLE (60M)" atau "PERPANJANG SESI" untuk kembali memasukkan/mengedit data ke Spreadsheet.'
          );
        } else if (info.remainingSeconds <= 300 && info.remainingSeconds > 60 && !warned5MinRef.current) {
          warned5MinRef.current = true;
          triggerNewTaskAlert(
            'Peringatan Sesi (< 5 Menit)',
            `Sisa sesi tulis Google tinggal ${info.formattedRemaining}. Klik "PERPANJANG SESI (+60M)" agar tidak tiba-tiba login ulang saat memasukkan/mengedit data.`
          );
        } else if (info.remainingSeconds <= 60 && !warned1MinRef.current) {
          warned1MinRef.current = true;
          triggerNewTaskAlert(
            'Sesi Hampir Habis (< 1 Menit)!',
            'Segera klik tombol "PERPANJANG SESI (+60M)" di bagian atas agar perubahan data Anda dapat disimpan ke Google Spreadsheet.'
          );
        }
      }
    };

    updateTimers();
    const timerId = setInterval(updateTimers, 1000);
    return () => clearInterval(timerId);
  }, [token]);

  // Handle Google Login / Session Refresh
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        warned5MinRef.current = false;
        warned1MinRef.current = false;
        setUser(result.user);
        setToken(result.accessToken);
        setSessionInfo(getSessionTimerInfo(result.accessToken));
        if (result.user.email) {
          localStorage.setItem(STORAGE_KEYS.ACTIVE_ADMIN, result.user.email);
        }
        triggerNewTaskAlert(
          'Sesi Google Aktif (60 Menit)',
          'Timer countdown sesi telah direset ke 60:00. Anda dapat memasukkan dan mengedit data dengan aman.'
        );
        await performSyncWithSheet(result.accessToken, false);
      }
    } catch (err: any) {
      console.warn('Google Sign In:', err?.message || err);
      const friendlyMsg = getAuthErrorMessage(err);
      triggerNewTaskAlert('Autentikasi Google / Firebase', friendlyMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout / Reset Session (stays as authorized admin)
  const handleGoogleLogout = async () => {
    await logout();
    const savedEmail = localStorage.getItem(STORAGE_KEYS.ACTIVE_ADMIN);
    const activeProfile = (savedEmail && ADMIN_PROFILES[savedEmail]) || ADMIN_PROFILES['irfandwi.hs@gmail.com'] || DEFAULT_ADMIN_USER;
    setUser(activeProfile);
    setToken(null);
    setSessionInfo(getSessionTimerInfo(null));
    warned5MinRef.current = false;
    warned1MinRef.current = false;
  };

  // Synchronize data with Google Sheets
  const performSyncWithSheet = async (accessToken: string | null, isBackground: boolean = false) => {
    if (!isBackground) setIsSyncing(true);
    try {
      if (accessToken && !isBackground) {
        syncCalculatorBreakdownToSheet(accessToken, spreadsheetId).catch(() => {
          // ignore
        });
      } else {
        fetchCalculatorBreakdownFromSheet(spreadsheetId, true).catch(() => {
          // ignore
        });
      }
      const remoteData = await loadSpreadsheetData(accessToken, spreadsheetId);
      
      // Check if new tasks arrived from sheet
      if (remoteData.tasks.length > prevTasksCount.current) {
        const newTasksCount = remoteData.tasks.length - prevTasksCount.current;
        triggerNewTaskAlert(
          'Tugas Baru Diterima!',
          `${newTasksCount} tugas baru telah dikirimkan oleh siswa ke Google Spreadsheet.`
        );
      }

      setTasks(remoteData.tasks);
      setStudents(remoteData.students);
      prevTasksCount.current = remoteData.tasks.length;

      const now = new Date();
      setLastSyncedAt(`${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err: any) {
      console.error('Error syncing with Google Sheets:', err);
    } finally {
      if (!isBackground) setIsSyncing(false);
    }
  };

  // Manual Sync trigger
  const handleManualSync = async () => {
    await performSyncWithSheet(token, false);
    const syncNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Sinkronisasi Manual Selesai',
      message: 'Data siswa dan karya tugas berhasil diperbarui dari Google Spreadsheet.',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      type: 'sync_success',
      read: false,
    };
    setNotifications((prev) => [syncNotif, ...prev]);
  };

  // Trigger sound & notification (Only active when in Master Mode)
  const triggerNewTaskAlert = (title: string, message: string, taskId?: string) => {
    if (soundEnabled && activeTab !== 'showcase') {
      playNotificationChime();
    }

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      type: 'task_submitted',
      read: false,
      taskId,
    };

    setNotifications((prev) => [newNotif, ...prev]);

    if (activeTab !== 'showcase') {
      setToastAlert({ title, message, taskId });

      setTimeout(() => {
        setToastAlert(null);
      }, 6000);
    }
  };

  // Submit new Task
  const handleCreateTask = async (taskData: Omit<TaskSubmission, 'id'>) => {
    const newId = `tsk-${Date.now()}`;
    const newTask: TaskSubmission = {
      id: newId,
      ...taskData,
    };

    setTasks((prev) => [newTask, ...prev]);
    prevTasksCount.current += 1;

    // Sync to Google Sheet if token available
    if (token) {
      const syncRes = await syncNewTaskToSheet(token, spreadsheetId, newTask);
      if (syncRes.success) {
        triggerNewTaskAlert(
          'Karya Berhasil Masuk ke Google Spreadsheet!',
          `${newTask.studentName} (${newTask.group}): "${newTask.taskTitle}" telah tersimpan di Google Spreadsheet.`,
          newId
        );
      } else if (syncRes.isPermissionError) {
        triggerNewTaskAlert(
          'Izin Editor Spreadsheet Diperlukan',
          `Karya tersimpan lokal. ${syncRes.message}`,
          newId
        );
      } else if (syncRes.isAuthError) {
        setToken(null);
        triggerNewTaskAlert(
          'Sesi Google Kedaluwarsa',
          `Karya tersimpan di aplikasi. Sesi Google Anda kedaluwarsa—klik LOGIN GOOGLE di bilah atas untuk menyinkronkan ke Spreadsheet asli.`,
          newId
        );
      } else {
        triggerNewTaskAlert(
          'Karya Disimpan Lokal',
          `Karya tersimpan di web: ${syncRes.message}`,
          newId
        );
      }
    } else {
      triggerNewTaskAlert(
        'Karya Berhasil Disimpan!',
        `${newTask.studentName} (${newTask.group}): "${newTask.taskTitle}" tersimpan di aplikasi. Klik tombol LOGIN GOOGLE di bilah atas jika ingin menulis otomatis ke Google Spreadsheet Anda.`,
        newId
      );
    }
  };

  // Sync All Tasks to Google Sheets
  const handleSyncAllTasksToSheet = async () => {
    let activeToken = token;
    if (!activeToken) {
      try {
        const authRes = await googleSignIn();
        if (authRes) {
          setUser(authRes.user);
          setToken(authRes.accessToken);
          activeToken = authRes.accessToken;
        }
      } catch (err) {
        console.warn('Google Sign In cancelled or failed:', err);
      }
    }

    if (!activeToken) {
      triggerNewTaskAlert(
        'Perlu Akses Akun Google',
        'Silakan hubungkan akun Google Anda dengan menekan tombol LOGIN GOOGLE agar dapat menulis ke Google Spreadsheet.'
      );
      return;
    }

    setIsSyncing(true);
    try {
      const res = await syncAllTasksToSheet(activeToken, spreadsheetId, tasks);
      if (res.success) {
        triggerNewTaskAlert(
          'Sinkronisasi Berhasil!',
          `${res.count} data karya siswa berhasil dimasukkan ke tab 'Tugas_Siswa' di Google Spreadsheet.`
        );
      } else if (res.isPermissionError) {
        triggerNewTaskAlert(
          'Izin Editor Spreadsheet Diperlukan',
          res.message
        );
      } else if (res.isAuthError) {
        setToken(null);
        triggerNewTaskAlert(
          'Sesi Google Kedaluwarsa',
          'Sesi autentikasi Google telah berakhir. Silakan login kembali dengan akun Google Anda.'
        );
      } else {
        triggerNewTaskAlert('Gagal Menyinkronkan', res.message);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Update existing Task (status, description, details)
  const handleUpdateTask = async (updatedTask: TaskSubmission) => {
    const newTasks = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    setTasks(newTasks);

    if (token) {
      const res = await syncAllTasksToSheet(token, spreadsheetId, newTasks);
      if (res.isAuthError) {
        setToken(null);
      }
    }
  };

  // Delete Task with confirmation
  const handleDeleteTask = async (taskId: string) => {
    const taskToDelete = tasks.find((t) => t.id === taskId);
    if (!taskToDelete) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Tugas Siswa?',
      message: `Apakah Anda yakin ingin menghapus karya "${taskToDelete.taskTitle}" oleh ${taskToDelete.studentName}? Data di spreadsheet akan disinkronkan.`,
      onConfirm: async () => {
        const newTasks = tasks.filter((t) => t.id !== taskId);
        setTasks(newTasks);
        prevTasksCount.current = newTasks.length;
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

        if (token) {
          const res = await syncAllTasksToSheet(token, spreadsheetId, newTasks);
          if (res.isAuthError) {
            setToken(null);
          }
        }
      },
    });
  };

  // Student CRUD operations
  const handleAddStudent = async (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      id: `std-${Date.now()}`,
      ...studentData,
    };
    const newStudents = [...students, newStudent];
    setStudents(newStudents);

    // Notification for added student
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Siswa Berhasil Ditambahkan',
      message: `${newStudent.name} (${newStudent.group}) berhasil ditambahkan ke daftar siswa.`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      type: 'info',
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);

    if (token) {
      const res = await syncAllStudentsToSheet(token, spreadsheetId, newStudents);
      if (res.success) {
        triggerNewTaskAlert('Siswa Tersimpan di Spreadsheet', `${newStudent.name} telah tersimpan ke Google Spreadsheet.`);
      } else if (res.isPermissionError) {
        triggerNewTaskAlert('Izin Editor Diperlukan', res.message);
      } else if (res.isAuthError) {
        setToken(null);
        triggerNewTaskAlert('Sesi Kedaluwarsa', 'Silakan klik LOGIN GOOGLE untuk menyinkronkan data siswa ke Spreadsheet.');
      }
    } else {
      triggerNewTaskAlert(
        'Siswa Tersimpan Lokal',
        `${newStudent.name} tersimpan di aplikasi. Hubungkan akun Google untuk menulis otomatis ke file Google Spreadsheet.`
      );
    }
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    const newStudents = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    setStudents(newStudents);

    if (token) {
      await syncAllStudentsToSheet(token, spreadsheetId, newStudents);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    const stdToDelete = students.find((s) => s.id === studentId);
    if (!stdToDelete) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Data Siswa?',
      message: `Apakah Anda yakin ingin menghapus data siswa "${stdToDelete.name}" (${stdToDelete.nis})? Ini akan memperbarui daftar siswa di spreadsheet.`,
      onConfirm: async () => {
        const newStudents = students.filter((s) => s.id !== studentId);
        setStudents(newStudents);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

        if (token) {
          await syncAllStudentsToSheet(token, spreadsheetId, newStudents);
        }
      },
    });
  };

  const handleSyncStudentsToSheet = async () => {
    let activeToken = token;
    if (!activeToken) {
      try {
        const authRes = await googleSignIn();
        if (authRes) {
          setUser(authRes.user);
          setToken(authRes.accessToken);
          activeToken = authRes.accessToken;
        }
      } catch (err) {
        console.warn('Google Sign In:', err);
      }
    }

    if (!activeToken) {
      triggerNewTaskAlert('Perlu Akses Akun Google', 'Silakan klik LOGIN GOOGLE agar dapat memperbarui spreadsheet.');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await syncAllStudentsToSheet(activeToken, spreadsheetId, students);
      if (res.success) {
        triggerNewTaskAlert('Sinkronisasi Siswa Berhasil', `${res.count} siswa berhasil disinkronkan ke Google Spreadsheet.`);
      } else if (res.isPermissionError) {
        triggerNewTaskAlert('Izin Editor Diperlukan', res.message);
      } else {
        triggerNewTaskAlert('Gagal Sinkronisasi Siswa', res.message);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Notification handlers
  const handleMarkAllNotifsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAllNotifs = () => {
    setNotifications([]);
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  // Extract all groups list
  const groupsList: string[] = Array.from(
    new Set<string>(students.map((s) => s.group).filter(Boolean))
  ).sort();

  return (
    <div className="flex h-screen w-full bg-[#F2EFEB] font-sans overflow-hidden text-[#1a1a1a]">
      {/* High Density Left Sidebar (Mounted ONLY for Master Admin Views) */}
      {!isPublicTab(activeTab) && (
        <Sidebar
          activeTab={activeTab}
          onNavigate={handleNavigate}
          onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          user={user}
          token={token}
          onLogin={handleGoogleLogin}
          onLogout={handleGoogleLogout}
          onSwitchAdminProfile={handleSwitchAdminProfile}
          isLoggingIn={isLoggingIn}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          spreadsheetUrl={spreadsheetUrl}
          sessionInfo={sessionInfo}
          masterOpenSeconds={masterOpenSeconds}
        />
      )}

      {/* Main Content Area Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Compact Header Bar */}
        <Header
          activeTab={activeTab}
          onNavigate={handleNavigate}
          user={user}
          token={token}
          onLogin={handleGoogleLogin}
          onLogout={handleGoogleLogout}
          onSwitchAdminProfile={handleSwitchAdminProfile}
          onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
          isLoggingIn={isLoggingIn}
          isSyncing={isSyncing}
          onManualSync={handleManualSync}
          lastSyncedAt={lastSyncedAt}
          unreadCount={unreadNotifCount}
          onToggleNotificationDrawer={() => setIsNotifDrawerOpen(!isNotifDrawerOpen)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          spreadsheetUrl={spreadsheetUrl}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          sessionInfo={sessionInfo}
          masterOpenSeconds={masterOpenSeconds}
        />

        {/* Real-time Toast Floating Alert (Only in Master Mode) */}
        {toastAlert && !isPublicTab(activeTab) && (
          <div className="fixed top-16 right-4 z-50 max-w-sm bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-3 font-mono-code animate-in slide-in-from-top-4 duration-200">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-[#2e59e6] text-white shrink-0">
                  <Bell className="h-4 w-4 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1a1a1a] uppercase">{toastAlert.title}</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{toastAlert.message}</p>
                  <button
                    onClick={() => {
                      handleNavigate('tasks', '/master/tasks');
                      setToastAlert(null);
                    }}
                    className="mt-1.5 text-[11px] font-bold text-[#2e59e6] hover:underline block"
                  >
                    Buka Rekapitulasi Tabel &rarr;
                  </button>
                </div>
              </div>
              <button
                onClick={() => setToastAlert(null)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Dashboard Canvas */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Compact Session Countdown Banner for Master Sub-Views (Grades, Calculator, Students, Tasks, Spreadsheet) */}
            {!isPublicTab(activeTab) && activeTab !== 'master' && (
              <SessionCountdownPanel
                sessionInfo={sessionInfo}
                masterOpenSeconds={masterOpenSeconds}
                isLoggingIn={isLoggingIn}
                onRefreshSession={handleGoogleLogin}
                onLogout={handleGoogleLogout}
                userEmail={user?.email}
                variant="compact-banner"
              />
            )}

            {/* View Switching — React Router (alias URL lama dipertahankan) */}
            <Routes>
              {/* Beranda baru = Materi Pembelajaran (showcase lama pindah ke /arsip-karya) */}
              <Route
                path="/"
                element={
                  <MateriView
                    onNavigatePraktek={handleOpenPraktek}
                  />
                }
              />

              {/* Ruang Praktik: Lab Excel, Studio Koding, Word & PowerPoint */}
              {['/praktek', '/praktik'].map((p) => (
                <Route
                  key={p}
                  path={p}
                  element={
                    <PraktekView
                      key={location.search}
                      initialTool={new URLSearchParams(location.search).get('tool')}
                      initialView={new URLSearchParams(location.search).get('view')}
                      onNavigateMateri={() => handleNavigate('materi', '/')}
                      onNavigateHome={() => handleNavigate('showcase', '/arsip-karya')}
                      onNavigateCek={() => handleNavigate('cek', '/cek')}
                      onNavigateKelas7={() => handleNavigate('kelas7', '/kelas7')}
                    />
                  }
                />
              ))}

              {/* Arsip Karya Siswa (hasil tugas KKA Kelas 8) */}
              {['/arsip-karya', '/showcase'].map((p) => (
                <Route
                  key={p}
                  path={p}
                  element={
                    <ShowcaseView
                      students={students}
                      tasks={tasks}
                      spreadsheetUrl={spreadsheetUrl}
                    />
                  }
                />
              ))}

              {['/cek', '/check', '/login-siswa'].map((p) => (
                <Route
                  key={p}
                  path={p}
                  element={
                    <StudentCheckView
                      key="cek-kelas8"
                      gradeLevel="8"
                      students={students}
                      spreadsheetId={spreadsheetId}
                      spreadsheetUrl={spreadsheetUrl}
                      onNavigateHome={() => handleNavigate('showcase', '/arsip-karya')}
                      onNavigatePengganti={() => handleNavigate('pengganti', '/pengganti')}
                      onNavigateKelas7={() => handleNavigate('kelas7', '/kelas7')}
                      onNavigateExcel={() => handleNavigate('praktek', '/praktek?tool=excel')}
                    />
                  }
                />
              ))}

              {/* Portal Kelas 7 (cek nilai & tugas) */}
              {['/kelas7', '/kelas-7', '/cek-kelas7', '/cek7'].map((p) => (
                <Route
                  key={p}
                  path={p}
                  element={
                    <Kelas7HubView
                      students={students}
                      spreadsheetId={spreadsheetId}
                      spreadsheetUrl={spreadsheetUrl}
                      onNavigateHome={() => handleNavigate('showcase', '/arsip-karya')}
                      onNavigateCek={() => handleNavigate('cek', '/cek')}
                      onNavigateMateri={() => handleNavigate('materi', '/')}
                    />
                  }
                />
              ))}

              {['/kuis', '/quiz', '/ujian'].map((p) => (
                <Route
                  key={p}
                  path={p}
                  element={
                    <StudentQuizView
                      onNavigateHome={() => handleNavigate('showcase', '/arsip-karya')}
                      onNavigateCek={(gl) =>
                        handleNavigate(gl === '7' ? 'kelas7' : 'cek', gl === '7' ? '/kelas7' : '/cek')
                      }
                    />
                  }
                />
              ))}

              {['/pengganti', '/tugas-pengganti', '/pengganti-kka2', '/kka2'].map((p) => (
                <Route
                  key={p}
                  path={p}
                  element={
                    <SubstituteTaskView
                      students={students}
                      spreadsheetId={spreadsheetId}
                      spreadsheetUrl={spreadsheetUrl}
                      token={token}
                      onLogin={handleGoogleLogin}
                      onNavigateShowcase={() => handleNavigate('showcase', '/arsip-karya')}
                      onNavigateCek={() => handleNavigate('cek', '/cek')}
                      onNotifySubmission={(sName, cName, aNo) => {
                        triggerNewTaskAlert(
                          'Tugas Pengganti Masuk!',
                          `Siswa ${sName} (${cName} - Absen ${aNo}) telah mengumpulkan link video tugas pengganti KKA 2.`
                        );
                      }}
                    />
                  }
                />
              ))}

              <Route
                path="/master"
                element={
                  <MasterDataView
                    students={students}
                    tasks={tasks}
                    notifications={notifications}
                    spreadsheetUrl={spreadsheetUrl}
                    spreadsheetId={spreadsheetId}
                    isSyncing={isSyncing}
                    lastSyncedAt={lastSyncedAt}
                    onManualSync={handleManualSync}
                    onQuickAddStudent={handleAddStudent}
                    onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
                    onClearNotifications={handleClearAllNotifs}
                    onNavigateTab={(tab) => handleNavigate(tab)}
                    sessionInfo={sessionInfo}
                    masterOpenSeconds={masterOpenSeconds}
                    isLoggingIn={isLoggingIn}
                    onRefreshSession={handleGoogleLogin}
                    onLogout={handleGoogleLogout}
                    userEmail={user?.email}
                  />
                }
              />

              {['/master/tasks', '/tasks'].map((p) => (
                <Route
                  key={p}
                  path={p}
                  element={
                    <TaskListView
                      tasks={tasks}
                      students={students}
                      onUpdateTask={handleUpdateTask}
                      onDeleteTask={handleDeleteTask}
                      onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
                      groupsList={groupsList}
                      onSyncAllTasksToSheet={handleSyncAllTasksToSheet}
                      isConnectedToSheet={!!token}
                      onLogin={handleGoogleLogin}
                    />
                  }
                />
              ))}

              {['/master/students', '/students'].map((p) => (
                <Route
                  key={p}
                  path={p}
                  element={
                    <StudentManagerView
                      students={students}
                      onAddStudent={handleAddStudent}
                      onUpdateStudent={handleUpdateStudent}
                      onDeleteStudent={handleDeleteStudent}
                      onSyncStudentsToSheet={handleSyncStudentsToSheet}
                      isSyncing={isSyncing}
                      isConnectedToSheet={!!token}
                    />
                  }
                />
              ))}

              {['/master/grades', '/grades'].map((p) => (
                <Route
                  key={p}
                  path={p}
                  element={
                    <GradeMappingView
                      spreadsheetId={spreadsheetId}
                      spreadsheetUrl={spreadsheetUrl}
                      token={token}
                      onLogin={handleGoogleLogin}
                      onShowAlert={(title, message) => triggerNewTaskAlert(title, message)}
                    />
                  }
                />
              ))}

              {['/master/calculator', '/calculator', '/kalkulator'].map((p) => (
                <Route
                  key={p}
                  path={p}
                  element={
                    <AcademicCalculatorView
                      spreadsheetId={spreadsheetId}
                      spreadsheetUrl={spreadsheetUrl}
                      token={token}
                      onLogin={handleGoogleLogin}
                      onShowAlert={(title, message) => triggerNewTaskAlert(title, message)}
                    />
                  }
                />
              ))}

              <Route
                path="/master/quiz"
                element={
                  <MasterQuizManagerView
                    spreadsheetId={spreadsheetId}
                    spreadsheetUrl={spreadsheetUrl}
                    token={token}
                    onLogin={handleGoogleLogin}
                    onShowAlert={(title, message) => triggerNewTaskAlert(title, message)}
                  />
                }
              />
              <Route
                path="/master/kuis"
                element={
                  <MasterQuizManagerView
                    spreadsheetId={spreadsheetId}
                    spreadsheetUrl={spreadsheetUrl}
                    token={token}
                    onLogin={handleGoogleLogin}
                    onShowAlert={(title, message) => triggerNewTaskAlert(title, message)}
                  />
                }
              />

              {['/master/excel', '/master/lab-excel'].map((p) => (
                <Route
                  key={p}
                  path={p}
                  element={
                    <ExcelLabMasterView
                      spreadsheetUrl={spreadsheetUrl}
                      onNavigateTab={(tab, path) => handleNavigate(tab, path)}
                    />
                  }
                />
              ))}

              {['/master/substitute', '/master/pengganti', '/master/tugas-pengganti', '/substitute'].map(
                (p) => (
                  <Route
                    key={p}
                    path={p}
                    element={
                      <MasterSubstituteTaskView
                        students={students}
                        spreadsheetId={spreadsheetId}
                        spreadsheetUrl={spreadsheetUrl}
                        token={token}
                        onLogin={handleGoogleLogin}
                      />
                    }
                  />
                )
              )}

              {['/master/spreadsheet', '/spreadsheet'].map((p) => (
                <Route
                  key={p}
                  path={p}
                  element={
                    <SpreadsheetIframeView
                      spreadsheetId={spreadsheetId}
                      spreadsheetUrl={spreadsheetUrl}
                      lastSyncedAt={lastSyncedAt}
                      onManualSync={handleManualSync}
                      isSyncing={isSyncing}
                      onSyncAllTasksToSheet={handleSyncAllTasksToSheet}
                      isConnectedToSheet={!!token}
                      onLogin={handleGoogleLogin}
                      tasksCount={tasks.length}
                    />
                  }
                />
              ))}

              {/* Fallback: halaman tidak dikenal -> beranda Materi (tautan lama seperti /materi?grade=7 ikut terbuka) */}
              <Route
                path="*"
                element={
                  <MateriView
                    onNavigatePraktek={handleOpenPraktek}
                  />
                }
              />
            </Routes>
          </div>
        </main>
      </div>

      {/* Task Submission Modal */}
      <TaskSubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        students={students}
        onSubmitTask={handleCreateTask}
        isSyncing={isSyncing}
        isConnectedToSheet={!!token}
        onLogin={handleGoogleLogin}
      />

      {/* Real-time Notification Drawer (Only in Master Mode) */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen && activeTab !== 'showcase'}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotifsAsRead}
        onClearAll={handleClearAllNotifs}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onSelectTaskNotification={() => {
          handleNavigate('tasks', '/master/tasks');
        }}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Login admin dengan email + password */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminEmailLogin}
      />
    </div>
  );
}
