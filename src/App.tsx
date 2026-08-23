import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  DEFAULT_ADMIN_USER,
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
} from './services/sheetsService';
import { playNotificationChime } from './services/sound';
import { Student, TaskSubmission, AppNotification } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ShowcaseView } from './components/ShowcaseView';
import { MasterDataView } from './components/MasterDataView';
import { TaskListView } from './components/TaskListView';
import { StudentManagerView } from './components/StudentManagerView';
import { GradeMappingView } from './components/GradeMappingView';
import { SpreadsheetIframeView } from './components/SpreadsheetIframeView';
import { TaskSubmissionModal } from './components/TaskSubmissionModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { ConfirmationModal } from './components/ConfirmationModal';
import {
  Bell,
  X,
} from 'lucide-react';

const STORAGE_KEYS = {
  TASKS: 'tugas_siswa_tasks_v3',
  STUDENTS: 'tugas_siswa_students_v3',
  NOTIFICATIONS: 'tugas_siswa_notifs_v3',
  SOUND: 'tugas_siswa_sound_enabled',
};

// Clear any stale cached data
try {
  localStorage.removeItem('tugas_siswa_tasks_v1');
  localStorage.removeItem('tugas_siswa_students_v1');
  localStorage.removeItem('tugas_siswa_grades_v1');
  localStorage.removeItem('tugas_siswa_tasks_v2');
  localStorage.removeItem('tugas_siswa_students_v2');
  localStorage.removeItem('tugas_siswa_grades_v2');
  localStorage.removeItem('tugas_siswa_grades_v3');
} catch (e) {
  // ignore
}

// Helper to determine route tab from pathname
const getTabFromPath = (path: string): 'showcase' | 'master' | 'tasks' | 'students' | 'grades' | 'spreadsheet' => {
  const cleanPath = (path || '/').toLowerCase().replace(/\/$/, '') || '/';
  if (cleanPath === '/master') return 'master';
  if (cleanPath === '/master/students' || cleanPath === '/students') return 'students';
  if (cleanPath === '/master/grades' || cleanPath === '/grades') return 'grades';
  if (cleanPath === '/master/tasks' || cleanPath === '/tasks') return 'tasks';
  if (cleanPath === '/master/spreadsheet' || cleanPath === '/spreadsheet') return 'spreadsheet';
  return 'showcase';
};

export default function App() {
  // Navigation state initialized based on current URL pathname
  const [activeTab, setActiveTab] = useState<'showcase' | 'master' | 'tasks' | 'students' | 'grades' | 'spreadsheet'>(() => {
    return getTabFromPath(window.location.pathname);
  });
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Sync route on popstate (browser back / forward button clicks)
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Programmatic navigation that updates the browser URL
  const handleNavigate = (tab: 'showcase' | 'master' | 'tasks' | 'students' | 'grades' | 'spreadsheet', targetPath?: string) => {
    setActiveTab(tab);
    const resolvedPath =
      targetPath || (tab === 'showcase' ? '/' : `/master${tab === 'master' ? '' : `/${tab}`}`);
    if (window.location.pathname !== resolvedPath) {
      window.history.pushState({}, '', resolvedPath);
    }
  };

  // Auth & Google Sheets State - Default logged in as irfannewbie7@gmail.com
  const [user, setUser] = useState<User | null>(DEFAULT_ADMIN_USER);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [spreadsheetId] = useState<string>(DEFAULT_SPREADSHEET_ID);
  const [spreadsheetUrl] = useState<string>(DEFAULT_SPREADSHEET_URL);

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
        if (Array.isArray(parsed) && parsed.length >= 200) return parsed;
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

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        await performSyncWithSheet(result.accessToken, false);
      }
    } catch (err: any) {
      console.warn('Google Sign In:', err?.message || err);
      triggerNewTaskAlert(
        'Login Google',
        err?.message || 'Tidak dapat menyelesaikan login dengan Google. Pastikan popup browser diizinkan dan coba kembali.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout / Reset Session (stays as default admin)
  const handleGoogleLogout = async () => {
    await logout();
    setUser(DEFAULT_ADMIN_USER);
    setToken(null);
  };

  // Synchronize data with Google Sheets
  const performSyncWithSheet = async (accessToken: string | null, isBackground: boolean = false) => {
    if (!isBackground) setIsSyncing(true);
    try {
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
          `${newTask.studentName} (${newTask.group}): "${newTask.taskTitle}" telah tersimpan di tab 'Tugas_Siswa'.`,
          newId
        );
      } else if (syncRes.isAuthError) {
        setToken(null);
        triggerNewTaskAlert(
          'Karya Disimpan Lokal',
          `Karya tersimpan di aplikasi. Sesi Google Anda kedaluwarsa—klik LOGIN (GOOGLE) di bilah atas untuk menyinkronkan ke Spreadsheet asli.`,
          newId
        );
      } else {
        triggerNewTaskAlert(
          'Karya Disimpan Lokal',
          `Karya tersimpan di web, respon Spreadsheet: ${syncRes.message}`,
          newId
        );
      }
    } else {
      triggerNewTaskAlert(
        'Karya Berhasil Disimpan!',
        `${newTask.studentName} (${newTask.group}): "${newTask.taskTitle}" tersimpan di aplikasi. Klik LOGIN (GOOGLE) untuk menulis otomatis ke file Google Spreadsheet Anda.`,
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
        'Silakan hubungkan akun Google Anda dengan menekan tombol Login Google agar dapat menulis ke Google Spreadsheet.'
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
      await syncAllStudentsToSheet(token, spreadsheetId, newStudents);
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
    if (token) {
      setIsSyncing(true);
      await syncAllStudentsToSheet(token, spreadsheetId, students);
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
      {/* High Density Left Sidebar (Mounted ONLY for Master Views) */}
      {activeTab !== 'showcase' && (
        <Sidebar
          activeTab={activeTab}
          onNavigate={handleNavigate}
          onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          user={user}
          token={token}
          onLogin={handleGoogleLogin}
          onLogout={handleGoogleLogout}
          isLoggingIn={isLoggingIn}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          spreadsheetUrl={spreadsheetUrl}
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
        />

        {/* Real-time Toast Floating Alert (Only in Master Mode) */}
        {toastAlert && activeTab !== 'showcase' && (
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
            {/* View Switching */}
            {activeTab === 'showcase' && (
              <ShowcaseView
                students={students}
                tasks={tasks}
                spreadsheetUrl={spreadsheetUrl}
              />
            )}

            {activeTab === 'master' && (
              <MasterDataView
                students={students}
                tasks={tasks}
                notifications={notifications}
                spreadsheetUrl={spreadsheetUrl}
                spreadsheetId={spreadsheetId}
                isSyncing={isSyncing}
                onManualSync={handleManualSync}
                onQuickAddStudent={handleAddStudent}
                onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
                onNavigateTab={(tab) => handleNavigate(tab)}
              />
            )}

            {activeTab === 'tasks' && (
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
            )}

            {activeTab === 'students' && (
              <StudentManagerView
                students={students}
                onAddStudent={handleAddStudent}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
                onSyncStudentsToSheet={handleSyncStudentsToSheet}
                isSyncing={isSyncing}
                isConnectedToSheet={!!token}
              />
            )}

            {activeTab === 'grades' && (
              <GradeMappingView
                spreadsheetId={spreadsheetId}
                spreadsheetUrl={spreadsheetUrl}
                token={token}
                onLogin={handleGoogleLogin}
                onShowAlert={(title, message) => triggerNewTaskAlert(title, message)}
              />
            )}

            {activeTab === 'spreadsheet' && (
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
            )}
          </div>
        </main>

        {/* Bottom Corner Anchors matching the design specification */}
        <footer className="h-9 px-4 sm:px-6 bg-[#F2EFEB] border-t-[1.5px] border-[#1a1a1a] flex items-center justify-between text-[11px] font-mono-code font-bold text-[#1a1a1a] select-none shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#2e59e6] transition-colors"
            >
              DATA SOURCE: G-SHEET
            </a>
          </div>
          <div className="text-slate-600">
            © 2026 SHOWCASE — REKAYASA PERANGKAT LUNAK
          </div>
        </footer>
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
    </div>
  );
}
