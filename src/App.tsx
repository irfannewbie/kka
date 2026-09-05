import React, { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import {
  initAuth,
  googleSignIn,
  logout,
  DEFAULT_ADMIN_USER,
  ADMIN_PROFILES,
  ADMIN_EMAILS,
  getAuthErrorMessage,
  getAccessTokenExpiryTimestamp,
  isAuthorizedAdmin,
} from "./services/firebaseAuth";
import {
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_SPREADSHEET_URL,
  INITIAL_STUDENTS_MOCK,
  INITIAL_TASKS_MOCK,
  loadSpreadsheetData,
  syncNewTaskToSheet,
  syncAllTasksToSheet,
  syncAllStudentsToSheet,
  fetchPageArchiveConfig,
  savePageArchiveConfig,
  appendAdminActivityLog,
  backupPageConfiguration,
  restoreLatestPageConfiguration,
  loadSubstituteTaskSubmissions,
  PageArchiveConfig,
} from "./services/sheetsService";
import { playNotificationChime } from "./services/sound";
import {
  Student,
  TaskSubmission,
  AppNotification,
  SubstituteTaskSubmission,
} from "./types";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { ShowcaseView } from "./components/ShowcaseView";
import { MasterDataView } from "./components/MasterDataView";
import { TaskListView } from "./components/TaskListView";
import { StudentManagerView } from "./components/StudentManagerView";
import { GradeMappingView } from "./components/GradeMappingView";
import { SpreadsheetIframeView } from "./components/SpreadsheetIframeView";
import { StudentCheckView } from "./components/StudentCheckView";
import {
  SubstituteTaskView,
  SUBSTITUTE_TASK_DEADLINE,
} from "./components/SubstituteTaskView";
import { MasterSubstituteTaskView } from "./components/MasterSubstituteTaskView";
import { TaskSubmissionModal } from "./components/TaskSubmissionModal";
import { NotificationDrawer } from "./components/NotificationDrawer";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { Bell, X } from "lucide-react";

const STORAGE_KEYS = {
  TASKS: "tugas_siswa_tasks_v3",
  STUDENTS: "tugas_siswa_students_v3",
  NOTIFICATIONS: "tugas_siswa_notifs_v3",
  SOUND: "tugas_siswa_sound_enabled",
  ACTIVE_ADMIN: "tugas_siswa_active_admin_email_v3",
};

// Clear any stale cached data
try {
  localStorage.removeItem("tugas_siswa_tasks_v1");
  localStorage.removeItem("tugas_siswa_students_v1");
  localStorage.removeItem("tugas_siswa_grades_v1");
  localStorage.removeItem("tugas_siswa_tasks_v2");
  localStorage.removeItem("tugas_siswa_students_v2");
  localStorage.removeItem("tugas_siswa_grades_v2");
  localStorage.removeItem("tugas_siswa_grades_v3");
} catch (e) {
  // ignore
}

// Helper to determine route tab from pathname
const getTabFromPath = (
  path: string,
):
  | "showcase"
  | "master"
  | "tasks"
  | "students"
  | "grades"
  | "spreadsheet"
  | "cek"
  | "pengganti"
  | "substitute_tasks" => {
  const cleanPath = (path || "/").toLowerCase().replace(/\/$/, "") || "/";
  if (
    cleanPath === "/cek" ||
    cleanPath === "/check" ||
    cleanPath === "/login-siswa"
  )
    return "cek";
  if (
    cleanPath === "/pengganti" ||
    cleanPath === "/tugas-pengganti" ||
    cleanPath === "/pengganti-kka2" ||
    cleanPath === "/kka2"
  )
    return "pengganti";
  if (cleanPath === "/master") return "master";
  if (cleanPath === "/master/students" || cleanPath === "/students")
    return "students";
  if (cleanPath === "/master/grades" || cleanPath === "/grades")
    return "grades";
  if (cleanPath === "/master/tasks" || cleanPath === "/tasks") return "tasks";
  if (
    cleanPath === "/master/substitute" ||
    cleanPath === "/master/pengganti" ||
    cleanPath === "/master/tugas-pengganti" ||
    cleanPath === "/substitute"
  )
    return "substitute_tasks";
  if (cleanPath === "/master/spreadsheet" || cleanPath === "/spreadsheet")
    return "spreadsheet";
  return "showcase";
};

export default function App() {
  // Navigation state initialized based on current URL pathname
  const [activeTab, setActiveTab] = useState<
    | "showcase"
    | "master"
    | "tasks"
    | "students"
    | "grades"
    | "spreadsheet"
    | "cek"
    | "pengganti"
    | "substitute_tasks"
  >(() => {
    return getTabFromPath(window.location.pathname);
  });
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] =
    useState<boolean>(false);

  // Sync route on popstate (browser back / forward button clicks)
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Programmatic navigation that updates the browser URL
  const handleNavigate = (
    tab:
      | "showcase"
      | "master"
      | "tasks"
      | "students"
      | "grades"
      | "spreadsheet"
      | "cek"
      | "pengganti"
      | "substitute_tasks",
    targetPath?: string,
  ) => {
    setActiveTab(tab);
    let resolvedPath = targetPath;
    if (!resolvedPath) {
      if (tab === "showcase") resolvedPath = "/";
      else if (tab === "cek") resolvedPath = "/cek";
      else if (tab === "pengganti") resolvedPath = "/pengganti";
      else if (tab === "substitute_tasks") resolvedPath = "/master/substitute";
      else resolvedPath = `/master${tab === "master" ? "" : `/${tab}`}`;
    }
    if (window.location.pathname !== resolvedPath) {
      window.history.pushState({}, "", resolvedPath);
    }
  };

  // Auth & Google Sheets State - Default logged in as irfandwi.hs@gmail.com / irfannewbie7@gmail.com
  const [user, setUser] = useState<User | null>(() => {
    const savedEmail = localStorage.getItem(STORAGE_KEYS.ACTIVE_ADMIN);
    if (savedEmail && ADMIN_PROFILES[savedEmail]) {
      return ADMIN_PROFILES[savedEmail];
    }
    return ADMIN_PROFILES["irfandwi.hs@gmail.com"] || DEFAULT_ADMIN_USER;
  });
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [connectionSecondsRemaining, setConnectionSecondsRemaining] = useState<
    number | null
  >(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [spreadsheetId] = useState<string>(DEFAULT_SPREADSHEET_ID);
  const [spreadsheetUrl] = useState<string>(DEFAULT_SPREADSHEET_URL);
  const [archiveConfig, setArchiveConfig] = useState<PageArchiveConfig | null>(
    null,
  );
  const [isArchiveConfigLoading, setIsArchiveConfigLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [substituteSubmissions, setSubstituteSubmissions] = useState<
    SubstituteTaskSubmission[]
  >([]);

  const isSubstitutePageArchived =
    isArchiveConfigLoading ||
    currentTime >= new Date(SUBSTITUTE_TASK_DEADLINE).getTime() ||
    Boolean(archiveConfig?.archived);

  useEffect(() => {
    const timerId = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const handleApplySubstitutePageArchive = async () => {
    if (!token || !isAuthorizedAdmin(user?.email)) {
      triggerNewTaskAlert(
        "Akses Admin Diperlukan",
        "Gunakan akun Google administrator yang terdaftar untuk mengubah arsip halaman secara global.",
      );
      return;
    }

    const nextArchived = !isSubstitutePageArchived;
    const nextConfig: PageArchiveConfig = {
      pageKey: "pengganti",
      path: "/pengganti",
      archived: nextArchived,
      archiveAt: archiveConfig?.archiveAt || null,
      reason: archiveConfig?.reason || "",
      updatedAt: new Date().toISOString(),
      updatedBy: user.email || "",
    };
    const result = await savePageArchiveConfig(
      token,
      spreadsheetId,
      nextConfig,
    );
    if (result.success) {
      setArchiveConfig(nextConfig);
      void appendAdminActivityLog(
        token,
        spreadsheetId,
        user.email || "",
        nextArchived ? "ARSIPKAN_HALAMAN" : "BUKA_HALAMAN",
        `${nextConfig.path} ${nextConfig.reason}`,
      );
    }
    triggerNewTaskAlert(
      result.success ? "Konfigurasi Halaman" : "Gagal Mengubah Arsip",
      result.message,
    );
  };

  const handleToggleSubstitutePageArchive = () => {
    if (isSubstitutePageArchived) {
      setConfirmConfig({
        isOpen: true,
        title: "Buka Kembali Halaman?",
        message:
          "Siswa akan dapat mengakses kembali halaman dan mengirimkan tugas setelah konfigurasi dibuka.",
        onConfirm: () => {
          setConfirmConfig((current) => ({ ...current, isOpen: false }));
          void handleApplySubstitutePageArchive();
        },
      });
      return;
    }
    void handleApplySubstitutePageArchive();
  };

  const handleSaveArchiveSchedule = async (
    archiveAt: string,
    reason: string,
  ) => {
    if (!token || !isAuthorizedAdmin(user?.email)) {
      triggerNewTaskAlert(
        "Akses Admin Diperlukan",
        "Login dengan akun administrator yang sah terlebih dahulu.",
      );
      return;
    }
    const nextConfig: PageArchiveConfig = {
      pageKey: "pengganti",
      path: "/pengganti",
      archived: isSubstitutePageArchived,
      archiveAt: archiveAt || null,
      reason,
      updatedAt: new Date().toISOString(),
      updatedBy: user.email || "",
    };
    const result = await savePageArchiveConfig(
      token,
      spreadsheetId,
      nextConfig,
    );
    if (result.success) {
      setArchiveConfig(nextConfig);
      void appendAdminActivityLog(
        token,
        spreadsheetId,
        user.email || "",
        "JADWALKAN_ARSIP",
        `${nextConfig.path} ${archiveAt || "dibatalkan"}`,
      );
    }
    triggerNewTaskAlert(
      result.success ? "Jadwal Disimpan" : "Gagal Menyimpan Jadwal",
      result.message,
    );
  };

  const handleBackupConfiguration = async () => {
    if (!token || !isAuthorizedAdmin(user?.email) || !archiveConfig) {
      triggerNewTaskAlert(
        "Backup Tidak Tersedia",
        "Login sebagai admin dan muat konfigurasi halaman terlebih dahulu.",
      );
      return;
    }
    const result = await backupPageConfiguration(
      token,
      spreadsheetId,
      user.email || "",
      archiveConfig,
    );
    void appendAdminActivityLog(
      token,
      spreadsheetId,
      user.email || "",
      "BACKUP_KONFIGURASI",
      "Backup konfigurasi halaman dibuat",
    );
    triggerNewTaskAlert(
      result.success ? "Backup Berhasil" : "Backup Gagal",
      result.message,
    );
  };

  const handleRestoreConfiguration = async () => {
    if (!token || !isAuthorizedAdmin(user?.email)) {
      triggerNewTaskAlert(
        "Akses Admin Diperlukan",
        "Login sebagai administrator untuk memulihkan konfigurasi.",
      );
      return;
    }
    const result = await restoreLatestPageConfiguration(token, spreadsheetId);
    if (result.success && result.config) {
      const restored = {
        ...result.config,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email || "",
      };
      const saveResult = await savePageArchiveConfig(
        token,
        spreadsheetId,
        restored,
      );
      if (saveResult.success) setArchiveConfig(restored);
      if (saveResult.success)
        void appendAdminActivityLog(
          token,
          spreadsheetId,
          user.email || "",
          "PULIHKAN_KONFIGURASI",
          "Backup konfigurasi terbaru dipulihkan",
        );
      triggerNewTaskAlert(
        saveResult.success ? "Pemulihan Berhasil" : "Pemulihan Gagal",
        saveResult.message,
      );
      return;
    }
    triggerNewTaskAlert("Pemulihan Gagal", result.message);
  };

  useEffect(() => {
    if (!token) {
      setConnectionSecondsRemaining(null);
      return;
    }

    const updateConnectionTimer = () => {
      const expiryTimestamp = getAccessTokenExpiryTimestamp();
      if (!expiryTimestamp) {
        setConnectionSecondsRemaining(null);
        return;
      }

      const secondsRemaining = Math.max(
        0,
        Math.ceil((expiryTimestamp - Date.now()) / 1000),
      );
      setConnectionSecondsRemaining(secondsRemaining);
      if (secondsRemaining === 0) {
        setToken(null);
      }
    };

    updateConnectionTimer();
    const timerId = window.setInterval(updateConnectionTimer, 1000);
    return () => window.clearInterval(timerId);
  }, [token]);

  // Switch between authorized admin profiles
  const handleSwitchAdminProfile = (email: string) => {
    const profile = ADMIN_PROFILES[email] || {
      ...DEFAULT_ADMIN_USER,
      email: email,
      displayName: email.split("@")[0],
    };
    setUser(profile);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ADMIN, email);
    triggerNewTaskAlert(
      "Profil Admin Aktif",
      `Akun admin beralih ke: ${email}`,
    );
  };

  // Sound preference
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
    return saved !== null ? saved === "true" : true;
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
              !t.id?.startsWith("tsk-8d-") &&
              !t.id?.startsWith("tsk-8a-") &&
              !t.id?.startsWith("tsk-8b-") &&
              !t.id?.startsWith("tsk-8c-") &&
              !t.id?.startsWith("tsk-8h-"),
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
            id: "notif-1",
            title: "Sistem Terhubung ke Spreadsheet",
            message:
              "Aplikasi membaca basis data dari Google Spreadsheet Anda.",
            timestamp: new Date().toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: "info",
            read: false,
          },
        ];
  });

  // Active Toast Alert for new tasks
  const [toastAlert, setToastAlert] = useState<{
    title: string;
    message: string;
    taskId?: string;
  } | null>(null);

  // Destructive Confirmation Modal
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
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
        setLastSyncedAt(
          `${now.toLocaleDateString("id-ID")} ${now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
        );
      } catch (err) {
        console.warn("Initial spreadsheet fetch failed:", err);
      }
    }
    fetchInitialData();
  }, [spreadsheetId]);

  // Initialize Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      async (authenticatedUser, accessToken) => {
        if (!isAuthorizedAdmin(authenticatedUser.email) || !accessToken) {
          setUser(null);
          setToken(null);
          return;
        }
        setUser(authenticatedUser);
        setToken(accessToken);
        // Automatically sync from Google Sheet upon successful auth
        performSyncWithSheet(accessToken, false);
      },
      () => {
        setUser(null);
        setToken(null);
      },
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
    localStorage.setItem(
      STORAGE_KEYS.NOTIFICATIONS,
      JSON.stringify(notifications),
    );
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SOUND, soundEnabled.toString());
  }, [soundEnabled]);

  useEffect(() => {
    let isMounted = true;
    fetchPageArchiveConfig(spreadsheetId, "pengganti")
      .then((config) => {
        if (isMounted) {
          setArchiveConfig(config);
          setIsArchiveConfigLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setArchiveConfig({
            pageKey: "pengganti",
            path: "/pengganti",
            archived: true,
            archiveAt: null,
            reason: "Konfigurasi halaman tidak dapat diverifikasi.",
            updatedAt: new Date().toISOString(),
            updatedBy: "system",
          });
          setIsArchiveConfigLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [spreadsheetId]);

  useEffect(() => {
    let mounted = true;
    loadSubstituteTaskSubmissions(spreadsheetId, token)
      .then((rows) => {
        if (mounted) setSubstituteSubmissions(rows);
      })
      .catch(() => {
        if (mounted) setSubstituteSubmissions([]);
      });
    return () => {
      mounted = false;
    };
  }, [spreadsheetId, token]);

  useEffect(() => {
    if (!archiveConfig?.archiveAt || archiveConfig.archived) return;
    const timerId = window.setInterval(() => {
      if (Date.now() >= new Date(archiveConfig.archiveAt as string).getTime()) {
        setArchiveConfig((current) =>
          current ? { ...current, archived: true } : current,
        );
      }
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [archiveConfig]);

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
        if (!isAuthorizedAdmin(result.user.email)) {
          await logout();
          setUser(null);
          setToken(null);
          triggerNewTaskAlert(
            "Akun Tidak Diizinkan",
            "Akun Google ini tidak terdaftar sebagai administrator aplikasi.",
          );
          return;
        }
        setUser(result.user);
        setToken(result.accessToken);
        if (result.user.email) {
          localStorage.setItem(STORAGE_KEYS.ACTIVE_ADMIN, result.user.email);
        }
        void appendAdminActivityLog(
          result.accessToken,
          spreadsheetId,
          result.user.email || "",
          "LOGIN",
          "Login Google admin berhasil",
        );
        await performSyncWithSheet(result.accessToken, false);
      }
    } catch (err: any) {
      console.warn("Google Sign In:", err?.message || err);
      const friendlyMsg = getAuthErrorMessage(err);
      triggerNewTaskAlert("Autentikasi Google / Firebase", friendlyMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout / Reset Session (stays as authorized admin)
  const handleGoogleLogout = async () => {
    if (token && isAuthorizedAdmin(user?.email)) {
      void appendAdminActivityLog(
        token,
        spreadsheetId,
        user?.email || "",
        "LOGOUT",
        "Sesi Google admin diakhiri",
      );
    }
    await logout();
    const savedEmail = localStorage.getItem(STORAGE_KEYS.ACTIVE_ADMIN);
    const activeProfile =
      (savedEmail && ADMIN_PROFILES[savedEmail]) ||
      ADMIN_PROFILES["irfandwi.hs@gmail.com"] ||
      DEFAULT_ADMIN_USER;
    setUser(activeProfile);
    setToken(null);
  };

  // Synchronize data with Google Sheets
  const performSyncWithSheet = async (
    accessToken: string | null,
    isBackground: boolean = false,
  ) => {
    if (!isBackground) setIsSyncing(true);
    try {
      const remoteData = await loadSpreadsheetData(accessToken, spreadsheetId);

      // Check if new tasks arrived from sheet
      if (remoteData.tasks.length > prevTasksCount.current) {
        const newTasksCount = remoteData.tasks.length - prevTasksCount.current;
        triggerNewTaskAlert(
          "Tugas Baru Diterima!",
          `${newTasksCount} tugas baru telah dikirimkan oleh siswa ke Google Spreadsheet.`,
        );
      }

      setTasks(remoteData.tasks);
      setStudents(remoteData.students);
      prevTasksCount.current = remoteData.tasks.length;

      const now = new Date();
      setLastSyncedAt(
        `${now.toLocaleDateString("id-ID")} ${now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
      );
    } catch (err: any) {
      console.error("Error syncing with Google Sheets:", err);
    } finally {
      if (!isBackground) setIsSyncing(false);
    }
  };

  // Manual Sync trigger
  const handleManualSync = async () => {
    await performSyncWithSheet(token, false);
  };

  // Trigger sound & notification (Only active when in Master Mode)
  const triggerNewTaskAlert = (
    title: string,
    message: string,
    taskId?: string,
  ) => {
    if (soundEnabled && activeTab !== "showcase") {
      playNotificationChime();
    }

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "task_submitted",
      read: false,
      taskId,
    };

    setNotifications((prev) => [newNotif, ...prev]);

    if (activeTab !== "showcase") {
      setToastAlert({ title, message, taskId });

      setTimeout(() => {
        setToastAlert(null);
      }, 6000);
    }
  };

  // Submit new Task
  const handleCreateTask = async (taskData: Omit<TaskSubmission, "id">) => {
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
          "Karya Berhasil Masuk ke Google Spreadsheet!",
          `${newTask.studentName} (${newTask.group}): "${newTask.taskTitle}" telah tersimpan di Google Spreadsheet.`,
          newId,
        );
      } else if (syncRes.isPermissionError) {
        triggerNewTaskAlert(
          "Izin Editor Spreadsheet Diperlukan",
          `Karya tersimpan lokal. ${syncRes.message}`,
          newId,
        );
      } else if (syncRes.isAuthError) {
        setToken(null);
        triggerNewTaskAlert(
          "Sesi Google Kedaluwarsa",
          `Karya tersimpan di aplikasi. Sesi Google Anda kedaluwarsa—klik LOGIN GOOGLE di bilah atas untuk menyinkronkan ke Spreadsheet asli.`,
          newId,
        );
      } else {
        triggerNewTaskAlert(
          "Karya Disimpan Lokal",
          `Karya tersimpan di web: ${syncRes.message}`,
          newId,
        );
      }
    } else {
      triggerNewTaskAlert(
        "Karya Berhasil Disimpan!",
        `${newTask.studentName} (${newTask.group}): "${newTask.taskTitle}" tersimpan di aplikasi. Klik tombol LOGIN GOOGLE di bilah atas jika ingin menulis otomatis ke Google Spreadsheet Anda.`,
        newId,
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
        console.warn("Google Sign In cancelled or failed:", err);
      }
    }

    if (!activeToken) {
      triggerNewTaskAlert(
        "Perlu Akses Akun Google",
        "Silakan hubungkan akun Google Anda dengan menekan tombol LOGIN GOOGLE agar dapat menulis ke Google Spreadsheet.",
      );
      return;
    }

    setIsSyncing(true);
    try {
      const res = await syncAllTasksToSheet(activeToken, spreadsheetId, tasks);
      if (res.success) {
        triggerNewTaskAlert(
          "Sinkronisasi Berhasil!",
          `${res.count} data karya siswa berhasil dimasukkan ke tab 'Tugas_Siswa' di Google Spreadsheet.`,
        );
      } else if (res.isPermissionError) {
        triggerNewTaskAlert("Izin Editor Spreadsheet Diperlukan", res.message);
      } else if (res.isAuthError) {
        setToken(null);
        triggerNewTaskAlert(
          "Sesi Google Kedaluwarsa",
          "Sesi autentikasi Google telah berakhir. Silakan login kembali dengan akun Google Anda.",
        );
      } else {
        triggerNewTaskAlert("Gagal Menyinkronkan", res.message);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Update existing Task (status, description, details)
  const handleUpdateTask = async (updatedTask: TaskSubmission) => {
    const newTasks = tasks.map((t) =>
      t.id === updatedTask.id ? updatedTask : t,
    );
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
      title: "Hapus Tugas Siswa?",
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
  const handleAddStudent = async (studentData: Omit<Student, "id">) => {
    const newStudent: Student = {
      id: `std-${Date.now()}`,
      ...studentData,
    };
    const newStudents = [...students, newStudent];
    setStudents(newStudents);

    // Notification for added student
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: "Siswa Berhasil Ditambahkan",
      message: `${newStudent.name} (${newStudent.group}) berhasil ditambahkan ke daftar siswa.`,
      timestamp: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "info",
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);

    if (token) {
      const res = await syncAllStudentsToSheet(
        token,
        spreadsheetId,
        newStudents,
      );
      if (res.success) {
        triggerNewTaskAlert(
          "Siswa Tersimpan di Spreadsheet",
          `${newStudent.name} telah tersimpan ke Google Spreadsheet.`,
        );
      } else if (res.isPermissionError) {
        triggerNewTaskAlert("Izin Editor Diperlukan", res.message);
      } else if (res.isAuthError) {
        setToken(null);
        triggerNewTaskAlert(
          "Sesi Kedaluwarsa",
          "Silakan klik LOGIN GOOGLE untuk menyinkronkan data siswa ke Spreadsheet.",
        );
      }
    } else {
      triggerNewTaskAlert(
        "Siswa Tersimpan Lokal",
        `${newStudent.name} tersimpan di aplikasi. Hubungkan akun Google untuk menulis otomatis ke file Google Spreadsheet.`,
      );
    }
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    const newStudents = students.map((s) =>
      s.id === updatedStudent.id ? updatedStudent : s,
    );
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
      title: "Hapus Data Siswa?",
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
        console.warn("Google Sign In:", err);
      }
    }

    if (!activeToken) {
      triggerNewTaskAlert(
        "Perlu Akses Akun Google",
        "Silakan klik LOGIN GOOGLE agar dapat memperbarui spreadsheet.",
      );
      return;
    }

    setIsSyncing(true);
    try {
      const res = await syncAllStudentsToSheet(
        activeToken,
        spreadsheetId,
        students,
      );
      if (res.success) {
        triggerNewTaskAlert(
          "Sinkronisasi Siswa Berhasil",
          `${res.count} siswa berhasil disinkronkan ke Google Spreadsheet.`,
        );
      } else if (res.isPermissionError) {
        triggerNewTaskAlert("Izin Editor Diperlukan", res.message);
      } else {
        triggerNewTaskAlert("Gagal Sinkronisasi Siswa", res.message);
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
    new Set<string>(students.map((s) => s.group).filter(Boolean)),
  ).sort();

  return (
    <div className="flex h-screen w-full bg-[#F2EFEB] font-sans overflow-hidden text-[#1a1a1a]">
      {/* High Density Left Sidebar (Mounted ONLY for Master Admin Views) */}
      {activeTab !== "showcase" &&
        activeTab !== "cek" &&
        activeTab !== "pengganti" && (
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
          isLoggingIn={isLoggingIn}
          isSyncing={isSyncing}
          onManualSync={handleManualSync}
          lastSyncedAt={lastSyncedAt}
          unreadCount={unreadNotifCount}
          onToggleNotificationDrawer={() =>
            setIsNotifDrawerOpen(!isNotifDrawerOpen)
          }
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          spreadsheetUrl={spreadsheetUrl}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          connectionSecondsRemaining={connectionSecondsRemaining}
          onRenewConnection={handleGoogleLogin}
        />

        {/* Real-time Toast Floating Alert (Only in Master Mode) */}
        {toastAlert &&
          activeTab !== "showcase" &&
          activeTab !== "cek" &&
          activeTab !== "pengganti" && (
            <div className="fixed top-16 right-4 z-50 max-w-sm bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-3 font-mono-code animate-in slide-in-from-top-4 duration-200">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-[#2e59e6] text-white shrink-0">
                    <Bell className="h-4 w-4 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1a1a1a] uppercase">
                      {toastAlert.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      {toastAlert.message}
                    </p>
                    <button
                      onClick={() => {
                        handleNavigate("tasks", "/master/tasks");
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
            {activeTab === "showcase" && (
              <ShowcaseView
                students={students}
                tasks={tasks}
                spreadsheetUrl={spreadsheetUrl}
              />
            )}

            {activeTab === "cek" && (
              <StudentCheckView
                students={students}
                spreadsheetId={spreadsheetId}
                spreadsheetUrl={spreadsheetUrl}
                onNavigateHome={() => handleNavigate("showcase", "/")}
                onNavigatePengganti={() =>
                  handleNavigate("pengganti", "/pengganti")
                }
              />
            )}

            {activeTab === "pengganti" && (
              <SubstituteTaskView
                students={students}
                spreadsheetId={spreadsheetId}
                spreadsheetUrl={spreadsheetUrl}
                token={token}
                onLogin={handleGoogleLogin}
                onNavigateShowcase={() => handleNavigate("showcase", "/")}
                onNavigateCek={() => handleNavigate("cek", "/cek")}
                isArchived={isSubstitutePageArchived}
                onNotifySubmission={(sName, cName, aNo) => {
                  triggerNewTaskAlert(
                    "Tugas Pengganti Masuk!",
                    `Siswa ${sName} (${cName} - Absen ${aNo}) telah mengumpulkan link video tugas pengganti KKA 2.`,
                  );
                }}
              />
            )}

            {activeTab === "master" && (
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
                isSubstitutePageArchived={isSubstitutePageArchived}
                onToggleSubstitutePageArchive={
                  handleToggleSubstitutePageArchive
                }
                archiveAt={archiveConfig?.archiveAt || null}
                archiveReason={archiveConfig?.reason || ""}
                onSaveArchiveSchedule={handleSaveArchiveSchedule}
                onBackupConfiguration={handleBackupConfiguration}
                onRestoreConfiguration={handleRestoreConfiguration}
                submissions={substituteSubmissions}
                connectionSecondsRemaining={connectionSecondsRemaining}
              />
            )}

            {activeTab === "tasks" && (
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

            {activeTab === "students" && (
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

            {activeTab === "grades" && (
              <GradeMappingView
                spreadsheetId={spreadsheetId}
                spreadsheetUrl={spreadsheetUrl}
                token={token}
                onLogin={handleGoogleLogin}
                onShowAlert={(title, message) =>
                  triggerNewTaskAlert(title, message)
                }
              />
            )}

            {activeTab === "substitute_tasks" && (
              <MasterSubstituteTaskView
                students={students}
                spreadsheetId={spreadsheetId}
                spreadsheetUrl={spreadsheetUrl}
                token={token}
                onLogin={handleGoogleLogin}
              />
            )}

            {activeTab === "spreadsheet" && (
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
          <div className="text-slate-600">© 2026</div>
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
        isOpen={isNotifDrawerOpen && activeTab !== "showcase"}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotifsAsRead}
        onClearAll={handleClearAllNotifs}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onSelectTaskNotification={() => {
          handleNavigate("tasks", "/master/tasks");
        }}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() =>
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </div>
  );
}
