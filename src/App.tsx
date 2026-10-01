import React, { useState, useMemo } from 'react';
import {
  ActiveNavMenu,
  ProjectData,
  PlanEdition,
  PlanAnnouncement,
  ProjectTrackingItem,
  UserAccount,
  ALL_VILLAGES
} from './types';
import { storageService } from './services/storage';
import { authService } from './services/authService';
import { Sidebar } from './components/Sidebar';
import { BudgetApprovalView } from './components/BudgetApprovalView';
import { PlanDetail02View } from './components/PlanDetail02View';
import { PlanApprovalAnnouncementView } from './components/PlanApprovalAnnouncementView';
import { ProjectTrackingView } from './components/ProjectTrackingView';
import { LocalPlanReportView } from './components/LocalPlanReportView';
import { PlanBudgetComparisonReportView } from './components/PlanBudgetComparisonReportView';
import { ReportSystemView } from './components/ReportSystemView';
import { DashboardOverviewView } from './components/DashboardOverviewView';
import { CitizenPortalView } from './components/CitizenPortalView';
import { VillagePlanView } from './components/VillagePlanView';
import { VillagePlanReportView } from './components/VillagePlanReportView';
import { AuditLogView } from './components/AuditLogView';
import { DataManagementView } from './components/DataManagementView';
import { OtherViews } from './components/OtherViews';
import { BudgetApprovalModal } from './components/BudgetApprovalModal';
import { DataStorageModal } from './components/DataStorageModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { RemainingBudgetModal } from './components/RemainingBudgetModal';
import { InPlanProjectDetailModal } from './components/InPlanProjectDetailModal';
import { ProjectStatusWorkflowModal } from './components/ProjectStatusWorkflowModal';
import { PlanProjectFormModal } from './components/PlanProjectFormModal';
import { PlanHistoryModal } from './components/PlanHistoryModal';
import { AuthModal } from './components/AuthModal';
import { PublicVisitorModal } from './components/PublicVisitorModal';
import { VisitorAnalyticsModal } from './components/VisitorAnalyticsModal';
import { LoginScreen } from './components/LoginScreen';

export default function App() {
  // Authentication & Current User State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return authService.getCurrentUser();
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'public'>('login');
  const [isPublicModalOpen, setIsPublicModalOpen] = useState(false);
  const [isVisitorAnalyticsOpen, setIsVisitorAnalyticsOpen] = useState(false);

  // Default to 'citizen_portal' for public users or 'dashboard' for staff
  const [activeMenu, setActiveMenu] = useState<ActiveNavMenu>(() => {
    const user = authService.getCurrentUser();
    return user?.role === 'public' ? 'citizen_portal' : 'dashboard';
  });

  // Loaded Projects from persistent storage
  const [projects, setProjects] = useState<ProjectData[]>(() => {
    return storageService.getProjects();
  });

  // Loaded Announcements from persistent storage
  const [announcements, setAnnouncements] = useState<PlanAnnouncement[]>(() => {
    return storageService.getAnnouncements();
  });

  // Loaded Tracking Items from persistent storage
  const [trackingItems, setTrackingItems] = useState<ProjectTrackingItem[]>(() => {
    return storageService.getTrackingItems();
  });

  // Modal States
  const [selectedApprovalProject, setSelectedApprovalProject] = useState<ProjectData | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  // Master All-in-One Modal State (สายงานอนุมัติ Workflow 4 ขั้นตอน + ฟอร์มเปรียบเทียบแก้ไข + รายละเอียด ผ.02)
  const [selectedMasterProject, setSelectedMasterProject] = useState<ProjectData | null>(null);

  // Pop-up แสดงรายละเอียดโครงการ (แบบ ผ.02) เมื่อคลิกไอคอนรูปดวงตา 👁️ หรือปุ่มดูรายละเอียด
  const [selectedPlan02Project, setSelectedPlan02Project] = useState<ProjectData | null>(null);
  const setViewDetailProject = (p: ProjectData) => setSelectedPlan02Project(p);
  
  const [historyProject, setHistoryProject] = useState<ProjectData | null>(null);
  const [formProject, setFormProject] = useState<ProjectData | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formTargetEdition, setFormTargetEdition] = useState<PlanEdition>('first');

  // Sync & Storage Modals
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isRemainingBudgetModalOpen, setIsRemainingBudgetModalOpen] = useState(false);

  // Compute edition counts for sidebar badges
  const editionCounts = useMemo(() => {
    return {
      first: projects.filter((p) => p.edition === 'first').length,
      additional: projects.filter((p) => p.edition === 'additional').length,
      changed: projects.filter((p) => p.edition === 'changed').length,
      amended: projects.filter((p) => p.edition === 'amended').length
    };
  }, [projects]);

  // Helper: Get formatted Thai Date & Time for audit logging
  const getNowThaiTimestamp = (): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = 2571;
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  // Handle saving an approved/updated project in budget approval
  const handleSaveProjectApproval = (updatedProject: ProjectData) => {
    const nextProjects = projects.map((p) =>
      p.id === updatedProject.id ? updatedProject : p
    );
    setProjects(nextProjects);
    storageService.saveProjects(nextProjects);

    // Record to Audit Log
    storageService.addPlanAuditLog({
      timestamp: getNowThaiTimestamp(),
      planName: updatedProject.name,
      action: 'จัดสรรงบประมาณ',
      category: 'budget',
      actorName: currentUser?.fullName || 'เจ้าหน้าที่วิเคราะห์นโยบายและแผน',
      actorRole: currentUser?.role === 'executive' ? 'ผู้บริหาร' : 'เจ้าหน้าที่งบประมาณ',
      department: updatedProject.department || 'กองคลัง',
      targetCode: updatedProject.code || `ลำดับที่ ${updatedProject.orderNumber}`,
      details: `อนุมัติตั้งงบประมาณโครงการ จำนวน ${updatedProject.budgetApproved.toLocaleString()} บาท แหล่งเงิน: ${updatedProject.budgetSource}`,
      note: updatedProject.approvalOrderNo ? `คำสั่ง/มติ: ${updatedProject.approvalOrderNo}` : undefined,
      ipAddress: '192.168.10.20'
    });

    setIsApprovalModalOpen(false);
    setSelectedApprovalProject(null);
  };

  // Handle revoking project approval (Admin only unlock)
  const handleRevokeProjectApproval = (revokedProject: ProjectData) => {
    const nextProjects = projects.map((p) =>
      p.id === revokedProject.id ? revokedProject : p
    );
    setProjects(nextProjects);
    storageService.saveProjects(nextProjects);

    // Record to Audit Log
    storageService.addPlanAuditLog({
      timestamp: getNowThaiTimestamp(),
      planName: revokedProject.name,
      action: 'ปลดล็อกงบประมาณ',
      category: 'budget',
      actorName: currentUser?.fullName || 'ผู้ดูแลระบบ',
      actorRole: 'ผู้ดูแลระบบ (Admin)',
      department: 'กองยุทธศาสตร์และงบประมาณ',
      targetCode: revokedProject.code,
      details: `ปลดล็อกการอนุมัติงบประมาณโครงการเพื่อแก้ไขรายละเอียด`,
      ipAddress: '192.168.10.1 (Admin)'
    });
  };

  // Handle saving (add or edit) in Plan 02 View
  const handleSavePlanProject = (savedProject: ProjectData, keepModalOpen = false) => {
    const exists = projects.some((p) => p.id === savedProject.id);
    let nextProjects: ProjectData[];
    if (exists) {
      nextProjects = projects.map((p) => (p.id === savedProject.id ? savedProject : p));
    } else {
      nextProjects = [savedProject, ...projects];
    }
    setProjects(nextProjects);
    storageService.saveProjects(nextProjects);

    // Record to Audit Log
    storageService.addPlanAuditLog({
      timestamp: getNowThaiTimestamp(),
      planName: savedProject.name,
      action: exists
        ? savedProject.edition === 'changed'
          ? 'เปลี่ยนแปลงโครงการ'
          : savedProject.edition === 'amended'
          ? 'แก้ไขโครงการ'
          : 'แก้ไขข้อมูลโครงการ'
        : 'เพิ่มโครงการ',
      category: 'project_modification',
      actorName: currentUser?.fullName || 'เจ้าหน้าที่วิเคราะห์นโยบายและแผน',
      actorRole: currentUser?.role || 'เจ้าหน้าที่',
      department: savedProject.department || 'กองยุทธศาสตร์และงบประมาณ',
      targetCode: savedProject.code || `ลำดับที่ ${savedProject.orderNumber}`,
      details: `${exists ? 'แก้ไขข้อมูลโครงการ' : 'เพิ่มโครงการใหม่'} ในแผนพัฒนาท้องถิ่น (${savedProject.edition}) งบประมาณ ${(savedProject.budgetPlan || 0).toLocaleString()} บาท`,
      note: savedProject.reason || undefined,
      ipAddress: '192.168.10.25'
    });

    if (!keepModalOpen) {
      setIsFormModalOpen(false);
      setFormProject(null);
    }
  };

  // Handle deleting a project
  const handleDeletePlanProject = (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    const nextProjects = projects.filter((p) => p.id !== projectId);
    setProjects(nextProjects);
    storageService.saveProjects(nextProjects);

    if (target) {
      storageService.addPlanAuditLog({
        timestamp: getNowThaiTimestamp(),
        planName: target.name,
        action: 'ลบโครงการ',
        category: 'project_modification',
        actorName: currentUser?.fullName || 'เจ้าหน้าที่วิเคราะห์นโยบายและแผน',
        actorRole: currentUser?.role || 'เจ้าหน้าที่',
        department: target.department || 'กองยุทธศาสตร์และงบประมาณ',
        targetCode: target.code,
        details: `ลบโครงการออกจากระบบแผนพัฒนาท้องถิ่น`,
        ipAddress: '192.168.10.25'
      });
    }
  };

  // Handle bulk data update from storage import or reset
  const handleDataUpdated = (newProjects: ProjectData[]) => {
    setProjects(newProjects);
    storageService.saveProjects(newProjects);
  };

  // Handle saving an announcement (add or edit)
  const handleSaveAnnouncement = (ann: PlanAnnouncement, updatedProjects?: ProjectData[]) => {
    const exists = announcements.some((a) => a.id === ann.id);
    let nextAnnouncements: PlanAnnouncement[];
    if (exists) {
      nextAnnouncements = announcements.map((a) => (a.id === ann.id ? ann : a));
    } else {
      nextAnnouncements = [ann, ...announcements];
    }
    setAnnouncements(nextAnnouncements);
    storageService.saveAnnouncements(nextAnnouncements);

    if (updatedProjects && updatedProjects.length > 0) {
      setProjects(updatedProjects);
      storageService.saveProjects(updatedProjects);
    }

    // Record to Audit Log
    const actionLabel = ann.status === 'published' ? 'ประกาศใช้' : ann.status === 'approved' ? 'อนุมัติ' : 'บันทึกร่างประกาศ';
    storageService.addPlanAuditLog({
      timestamp: getNowThaiTimestamp(),
      planName: ann.planType,
      action: actionLabel,
      category: 'plan_approval',
      actorName: ann.approver || currentUser?.fullName || 'นายกเทศมนตรีเมืองศิลา',
      actorRole: 'ผู้บริหารสูงสุด',
      department: 'สำนักปลัดเทศบาล',
      targetCode: ann.announcementNo || ann.batchNumber,
      details: `${actionLabel}แผนพัฒนาท้องถิ่น งบประมาณรวม 5 ปี ${Math.round(ann.budgetTotal5Years || 0).toLocaleString()} บาท`,
      note: ann.note || undefined,
      ipAddress: '192.168.10.12'
    });
  };

  // Handle deleting an announcement
  const handleDeleteAnnouncement = (id: string) => {
    const nextAnnouncements = announcements.filter((a) => a.id !== id);
    setAnnouncements(nextAnnouncements);
    storageService.saveAnnouncements(nextAnnouncements);
  };

  // Handle saving tracking items
  const handleSaveTrackingItems = (items: ProjectTrackingItem[]) => {
    setTrackingItems(items);
    storageService.saveTrackingItems(items);
  };

  const handleOpenAddProject = (edition: PlanEdition) => {
    setFormTargetEdition(edition);
    setFormProject(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditProject = (project: ProjectData) => {
    setFormTargetEdition(project.edition);
    setFormProject(project);
    setIsFormModalOpen(true);
  };

  // If no user is logged in, present the Login & Access Portal
  if (!currentUser) {
    return (
      <div className="font-['Prompt',sans-serif] text-slate-800 antialiased min-h-screen">
        <LoginScreen
          currentUser={null}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            if (user.role === 'public') {
              setActiveMenu('citizen_portal');
            } else {
              setActiveMenu('dashboard');
            }
          }}
          onOpenRegister={() => {
            setAuthModalTab('register');
            setIsAuthModalOpen(true);
          }}
          onOpenPublicModal={() => setIsPublicModalOpen(true)}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          onUserChanged={(user) => {
            setCurrentUser(user);
            if (user.role === 'public') {
              setActiveMenu('citizen_portal');
            }
          }}
          onOpenAnalytics={() => setIsVisitorAnalyticsOpen(true)}
          initialTab={authModalTab}
        />

        <PublicVisitorModal
          isOpen={isPublicModalOpen}
          onClose={() => setIsPublicModalOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setActiveMenu('citizen_portal');
          }}
        />

        <VisitorAnalyticsModal
          isOpen={isVisitorAnalyticsOpen}
          onClose={() => setIsVisitorAnalyticsOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-['Prompt',sans-serif] text-slate-800 antialiased select-auto print:h-auto print:w-auto print:overflow-visible print:bg-white">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeMenu={activeMenu}
        onSelectMenu={(menu) => setActiveMenu(menu)}
        editionCounts={editionCounts}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenStorageModal={() => setIsStorageModalOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={() => {
          setAuthModalTab('login');
          setIsAuthModalOpen(true);
        }}
        onOpenVisitorAnalytics={() => setIsVisitorAnalyticsOpen(true)}
        onLogout={() => {
          authService.setCurrentUser(null);
          setCurrentUser(null);
        }}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 print:h-auto print:overflow-visible print:w-full print:m-0 print:p-0 print:block">
        {/* Render PlanDetail02View for the 4 editions */}
        {activeMenu === 'edition_first' && (
          <PlanDetail02View
            edition="first"
            projects={projects}
            onAddProject={handleOpenAddProject}
            onEditProject={handleOpenEditProject}
            onViewProject={(p) => setSelectedPlan02Project(p)}
            onViewHistory={(p) => setHistoryProject(p)}
            onDeleteProject={handleDeletePlanProject}
            onSaveNewProject={handleSavePlanProject}
            currentUser={currentUser}
            announcements={announcements}
          />
        )}

        {activeMenu === 'edition_additional' && (
          <PlanDetail02View
            edition="additional"
            projects={projects}
            onAddProject={handleOpenAddProject}
            onEditProject={handleOpenEditProject}
            onViewProject={(p) => setSelectedPlan02Project(p)}
            onViewHistory={(p) => setHistoryProject(p)}
            onDeleteProject={handleDeletePlanProject}
            onSaveNewProject={handleSavePlanProject}
            currentUser={currentUser}
            announcements={announcements}
          />
        )}

        {activeMenu === 'edition_changed' && (
          <PlanDetail02View
            edition="changed"
            projects={projects}
            onAddProject={handleOpenAddProject}
            onEditProject={handleOpenEditProject}
            onViewProject={(p) => setSelectedPlan02Project(p)}
            onViewHistory={(p) => setHistoryProject(p)}
            onDeleteProject={handleDeletePlanProject}
            onSaveNewProject={handleSavePlanProject}
            currentUser={currentUser}
            announcements={announcements}
          />
        )}

        {activeMenu === 'edition_amended' && (
          <PlanDetail02View
            edition="amended"
            projects={projects}
            onAddProject={handleOpenAddProject}
            onEditProject={handleOpenEditProject}
            onViewProject={(p) => setSelectedPlan02Project(p)}
            onViewHistory={(p) => setHistoryProject(p)}
            onDeleteProject={handleDeletePlanProject}
            onSaveNewProject={handleSavePlanProject}
            currentUser={currentUser}
            announcements={announcements}
          />
        )}

        {/* Budget Approval View */}
        {activeMenu === 'budget_approval' && (
          <BudgetApprovalView
            projects={projects}
            onOpenApprovalModal={(p) => {
              setSelectedApprovalProject(p);
              setIsApprovalModalOpen(true);
            }}
            onOpenRemainingBudgetReport={() => setIsRemainingBudgetModalOpen(true)}
            onOpenProjectDetail={(p) => setViewDetailProject(p)}
            onRevokeApproval={handleRevokeProjectApproval}
            onUpdateProjects={(nextProjects) => {
              setProjects(nextProjects);
              storageService.saveProjects(nextProjects);
            }}
            isAdmin={currentUser?.role === 'admin'}
            currentUser={currentUser}
          />
        )}

        {/* Approve Plan Announcement View (ระบบอนุมัติและประกาศใช้แผนพัฒนาท้องถิ่น) */}
        {activeMenu === 'approve_plan' && (
          <PlanApprovalAnnouncementView
            projects={projects}
            announcements={announcements}
            onSaveAnnouncement={handleSaveAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            onViewProjectDetail={(p) => setViewDetailProject(p)}
            onUpdateProjects={(nextProjects) => {
              setProjects(nextProjects);
              storageService.saveProjects(nextProjects);
            }}
          />
        )}

        {/* Project Tracking View (ระบบติดตามโครงการ ผ.03) */}
        {activeMenu === 'project_tracking' && (
          <ProjectTrackingView
            trackingItems={trackingItems}
            allProjects={projects}
            onSaveTrackingItems={handleSaveTrackingItems}
            onOpenProjectDetail={(p) => setViewDetailProject(p)}
          />
        )}

        {/* Local Plan Reports View (รายงานแผนพัฒนาท้องถิ่น ผ.01, ผ.02, ฉบับรวม) */}
        {activeMenu === 'report_plan' && (
          <LocalPlanReportView
            projects={projects}
            onOpenProjectDetail={(p) => setViewDetailProject(p)}
          />
        )}

        {/* Report System View (ระบบรายงาน - e-Report Dashboard & Statistics) */}
        {activeMenu === 'report_system' && (
          <ReportSystemView
            projects={projects}
            trackingItems={trackingItems}
            currentUser={currentUser}
            onNavigateToMenu={(menu) => setActiveMenu(menu)}
            onOpenProjectDetail={(p) => setViewDetailProject(p)}
          />
        )}

        {/* Plan Budget Comparison Report View (รายงานเปรียบเทียบแผน/งบประมาณ) */}
        {activeMenu === 'report_comparison' && (
          <PlanBudgetComparisonReportView
            projects={projects}
            onOpenProjectDetail={(p) => setViewDetailProject(p)}
          />
        )}

        {/* Audit Log & History View (ระบบประวัติและบันทึกการเปลี่ยนแปลง) */}
        {activeMenu === 'audit_log' && (
          <AuditLogView
            currentUser={currentUser}
            projects={projects}
            announcements={announcements}
            onOpenProjectDetail={(p) => setViewDetailProject(p)}
          />
        )}

        {/* Data Management, Search & Import View (จัดการข้อมูล / ค้นหา / นำเข้า) */}
        {activeMenu === 'data_management' && (
          <DataManagementView
            projects={projects}
            currentUser={currentUser}
            onSaveProject={handleSavePlanProject}
            onDeleteProject={handleDeletePlanProject}
            onViewProjectDetail={(p) => setViewDetailProject(p)}
            onNavigateToMenu={(menu) => setActiveMenu(menu)}
          />
        )}

        {/* Login Screen View (หน้า Login — เข้าระบบ) */}
        {activeMenu === 'login_screen' && (
          <div className="flex-1 overflow-y-auto">
            <LoginScreen
              currentUser={currentUser}
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                if (user.role === 'public') {
                  setActiveMenu('citizen_portal');
                } else {
                  setActiveMenu('dashboard');
                }
              }}
              onOpenRegister={() => {
                setAuthModalTab('register');
                setIsAuthModalOpen(true);
              }}
              onOpenPublicModal={() => setIsPublicModalOpen(true)}
              onBackToApp={() => {
                setActiveMenu(currentUser?.role === 'public' ? 'citizen_portal' : 'dashboard');
              }}
              onLogout={() => {
                authService.setCurrentUser(null);
                setCurrentUser(null);
              }}
            />
          </div>
        )}

        {/* Village Plan View (แผนพัฒนารายหมู่บ้าน - Zone Hierarchy) */}
        {activeMenu === 'village_plan' && (
          <VillagePlanView
            projects={projects}
            onViewProjectDetail={(p) => setViewDetailProject(p)}
            onRestoreInitialData={() => {
              const reset = storageService.resetToInitial();
              setProjects(reset);
            }}
            onAddNewProject={(vNum) => {
              const defaultV = vNum ? ALL_VILLAGES.find((v) => v.villageNumber === vNum) : undefined;
              setFormProject(
                defaultV
                  ? ({
                      villageNumber: defaultV.villageNumber,
                      village: defaultV.villageName,
                      zone: defaultV.zone
                    } as any)
                  : null
              );
              setFormTargetEdition('first');
              setIsFormModalOpen(true);
            }}
            onUpdateProject={handleSavePlanProject}
            currentUser={currentUser}
            onSwitchToReport={() => setActiveMenu('village_plan_report')}
          />
        )}

        {/* Village Plan Report View (รายงานแผนพัฒนารายหมู่บ้าน แบบ ผ.02 ทางการ 10 คอลัมน์) */}
        {activeMenu === 'village_plan_report' && (
          <VillagePlanReportView
            projects={projects}
            onOpenProjectDetail={(p) => setViewDetailProject(p)}
            onUpdateProject={handleSavePlanProject}
            currentUser={currentUser}
            onSwitchToInteractive={() => setActiveMenu('village_plan')}
          />
        )}

        {/* Citizen Information & Public Portal (หน้าระบบสำหรับประชาชน) */}
        {activeMenu === 'citizen_portal' && (
          <CitizenPortalView
            projects={projects}
            currentUser={currentUser}
            onNavigateToMenu={(menu) => setActiveMenu(menu)}
            onOpenProjectDetail={(p) => setViewDetailProject(p)}
            onOpenAuthModal={() => {
              setAuthModalTab('login');
              setIsAuthModalOpen(true);
            }}
            onLogout={() => {
              authService.setCurrentUser(null);
              setCurrentUser(null);
            }}
          />
        )}

        {/* Dashboard Overview View (ระบบแดชบอร์ดภาพรวมและสถิติ) */}
        {activeMenu === 'dashboard' && (
          <DashboardOverviewView
            projects={projects}
            trackingItems={trackingItems}
            announcements={announcements}
            onNavigateToMenu={(menu) => setActiveMenu(menu)}
            onViewProjectDetail={(p) => setViewDetailProject(p)}
            currentUser={currentUser}
            onOpenVisitorAnalytics={() => setIsVisitorAnalyticsOpen(true)}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            onSaveProject={handleSavePlanProject}
            onDeleteProject={handleDeletePlanProject}
          />
        )}

        {/* Other Views (Settings, etc.) */}
        {activeMenu !== 'edition_first' &&
          activeMenu !== 'edition_additional' &&
          activeMenu !== 'edition_changed' &&
          activeMenu !== 'edition_amended' &&
          activeMenu !== 'budget_approval' &&
          activeMenu !== 'approve_plan' &&
          activeMenu !== 'project_tracking' &&
          activeMenu !== 'village_plan' &&
          activeMenu !== 'village_plan_report' &&
          activeMenu !== 'report_system' &&
          activeMenu !== 'report_plan' &&
          activeMenu !== 'report_comparison' &&
          activeMenu !== 'audit_log' &&
          activeMenu !== 'data_management' &&
          activeMenu !== 'login_screen' &&
          activeMenu !== 'dashboard' &&
          activeMenu !== 'citizen_portal' && (
            <OtherViews
              activeMenu={activeMenu}
              projects={projects}
              onNavigateToBudgetApproval={() => setActiveMenu('budget_approval')}
              onOpenApprovalModal={(p) => {
                setSelectedApprovalProject(p);
                setIsApprovalModalOpen(true);
              }}
            />
          )}
      </main>

      {/* 3. Global Modals & Dialogs */}
      {/* Master All-in-One Modal (สายงานอนุมัติ Workflow 4 ขั้นตอน + ฟอร์มเปรียบเทียบแก้ไข + รายละเอียด ผ.02) */}
      {selectedMasterProject && (
        <ProjectStatusWorkflowModal
          project={selectedMasterProject}
          isOpen={Boolean(selectedMasterProject)}
          onClose={() => setSelectedMasterProject(null)}
          currentUser={currentUser}
          onSave={(updatedProject) => {
            handleSavePlanProject(updatedProject);
            setSelectedMasterProject(updatedProject);
          }}
          onDelete={(deletedId) => {
            handleDeletePlanProject(deletedId);
            setSelectedMasterProject(null);
          }}
          onNavigateToMenu={(menu) => setActiveMenu(menu)}
        />
      )}

      {/* Pop-up แสดงรายละเอียดโครงการ (แบบ ผ.02) เมื่อคลิกไอคอนรูปดวงตา 👁️ */}
      <InPlanProjectDetailModal
        project={selectedPlan02Project}
        isOpen={Boolean(selectedPlan02Project)}
        onClose={() => setSelectedPlan02Project(null)}
      />

      {/* Plan Project Form Modal (เพิ่มข้อมูลโครงการใหม่ / แก้ไขข้อมูลโครงการเดิม) */}
      {isFormModalOpen && (
        <PlanProjectFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setFormProject(null);
          }}
          onSave={(savedProject, keepModalOpen) => handleSavePlanProject(savedProject, keepModalOpen)}
          initialProject={formProject}
          defaultEdition={formTargetEdition}
          currentUser={currentUser}
          readOnly={currentUser?.role === 'public' || currentUser?.role === 'executive'}
        />
      )}

      {/* Plan History Modal */}
      {historyProject && (
        <PlanHistoryModal
          project={historyProject}
          allProjects={projects}
          onClose={() => setHistoryProject(null)}
          currentUser={currentUser}
          isPublic={currentUser?.role === 'public'}
          onOpenNewChange={(p) => {
            if (currentUser?.role === 'public' || currentUser?.role === 'executive') return;
            setHistoryProject(null);
            setSelectedMasterProject(p);
          }}
        />
      )}

      {/* Budget Allocation & Approval Modal */}
      {isApprovalModalOpen && selectedApprovalProject && (
        <BudgetApprovalModal
          isOpen={isApprovalModalOpen}
          project={selectedApprovalProject}
          onClose={() => {
            setIsApprovalModalOpen(false);
            setSelectedApprovalProject(null);
          }}
          onSave={handleSaveProjectApproval}
          currentUser={currentUser}
        />
      )}

      {/* Database / IndexedDB Storage Modal */}
      {isStorageModalOpen && (
        <DataStorageModal
          isOpen={isStorageModalOpen}
          onClose={() => setIsStorageModalOpen(false)}
          projects={projects}
          onDataUpdated={handleDataUpdated}
        />
      )}

      {/* Google Sheets & GAS Sync Modal */}
      {isSyncModalOpen && (
        <GoogleSheetsSyncModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          projects={projects}
          onDataUpdated={handleDataUpdated}
        />
      )}

      {/* Remaining Budget Modal */}
      {isRemainingBudgetModalOpen && (
        <RemainingBudgetModal
          isOpen={isRemainingBudgetModalOpen}
          onClose={() => setIsRemainingBudgetModalOpen(false)}
          projects={projects}
          year="2571"
        />
      )}

      {/* Authentication & User Switch Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          onUserChanged={(user) => setCurrentUser(user)}
          onOpenAnalytics={() => setIsVisitorAnalyticsOpen(true)}
          initialTab={authModalTab}
        />
      )}

      {/* Public Citizen Access Modal */}
      {isPublicModalOpen && (
        <PublicVisitorModal
          isOpen={isPublicModalOpen}
          onClose={() => setIsPublicModalOpen(false)}
          onSuccess={(user) => setCurrentUser(user)}
        />
      )}

      {/* Visitor Analytics Modal */}
      {isVisitorAnalyticsOpen && (
        <VisitorAnalyticsModal
          isOpen={isVisitorAnalyticsOpen}
          onClose={() => setIsVisitorAnalyticsOpen(false)}
        />
      )}
    </div>
  );
}
