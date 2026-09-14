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
import { ProjectSearchView } from './components/ProjectSearchView';
import { DashboardOverviewView } from './components/DashboardOverviewView';
import { VillagePlanView } from './components/VillagePlanView';
import { VillagePlanReportView } from './components/VillagePlanReportView';
import { OtherViews } from './components/OtherViews';
import { BudgetApprovalModal } from './components/BudgetApprovalModal';
import { DataStorageModal } from './components/DataStorageModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { RemainingBudgetModal } from './components/RemainingBudgetModal';
import { PlanProjectDetailModal } from './components/PlanProjectDetailModal';
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

  // Default to 'dashboard' matching user's requested overview screen
  const [activeMenu, setActiveMenu] = useState<ActiveNavMenu>('dashboard');

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

  // Plan 02 Modals
  const [viewDetailProject, setViewDetailProject] = useState<ProjectData | null>(null);
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

  // Handle saving an approved/updated project in budget approval
  const handleSaveProjectApproval = (updatedProject: ProjectData) => {
    const nextProjects = projects.map((p) =>
      p.id === updatedProject.id ? updatedProject : p
    );
    setProjects(nextProjects);
    storageService.saveProjects(nextProjects);
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
  };

  // Handle saving (add or edit) in Plan 02 View
  const handleSavePlanProject = (savedProject: ProjectData) => {
    const exists = projects.some((p) => p.id === savedProject.id);
    let nextProjects: ProjectData[];
    if (exists) {
      nextProjects = projects.map((p) => (p.id === savedProject.id ? savedProject : p));
    } else {
      nextProjects = [savedProject, ...projects];
    }
    setProjects(nextProjects);
    storageService.saveProjects(nextProjects);
    setIsFormModalOpen(false);
    setFormProject(null);
  };

  // Handle deleting a project
  const handleDeletePlanProject = (projectId: string) => {
    if (window.confirm('คุณต้องการลบโครงการนี้ออกจากแผนพัฒนาท้องถิ่นใช่หรือไม่?')) {
      const nextProjects = projects.filter((p) => p.id !== projectId);
      setProjects(nextProjects);
      storageService.saveProjects(nextProjects);
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
      <div className="font-['Sarabun',sans-serif] text-slate-800 antialiased min-h-screen">
        <LoginScreen
          onLoginSuccess={(user) => setCurrentUser(user)}
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
          onUserChanged={(user) => setCurrentUser(user)}
          onOpenAnalytics={() => setIsVisitorAnalyticsOpen(true)}
          initialTab={authModalTab}
        />

        <PublicVisitorModal
          isOpen={isPublicModalOpen}
          onClose={() => setIsPublicModalOpen(false)}
          onSuccess={(user) => setCurrentUser(user)}
        />

        <VisitorAnalyticsModal
          isOpen={isVisitorAnalyticsOpen}
          onClose={() => setIsVisitorAnalyticsOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-['Sarabun',sans-serif] text-slate-800 antialiased select-auto print:h-auto print:w-auto print:overflow-visible print:bg-white">
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
            onViewProject={(p) => setViewDetailProject(p)}
            onViewHistory={(p) => setHistoryProject(p)}
            onDeleteProject={handleDeletePlanProject}
            onSaveNewProject={handleSavePlanProject}
            currentUser={currentUser}
          />
        )}

        {activeMenu === 'edition_additional' && (
          <PlanDetail02View
            edition="additional"
            projects={projects}
            onAddProject={handleOpenAddProject}
            onEditProject={handleOpenEditProject}
            onViewProject={(p) => setViewDetailProject(p)}
            onViewHistory={(p) => setHistoryProject(p)}
            onDeleteProject={handleDeletePlanProject}
            onSaveNewProject={handleSavePlanProject}
            currentUser={currentUser}
          />
        )}

        {activeMenu === 'edition_changed' && (
          <PlanDetail02View
            edition="changed"
            projects={projects}
            onAddProject={handleOpenAddProject}
            onEditProject={handleOpenEditProject}
            onViewProject={(p) => setViewDetailProject(p)}
            onViewHistory={(p) => setHistoryProject(p)}
            onDeleteProject={handleDeletePlanProject}
            onSaveNewProject={handleSavePlanProject}
            currentUser={currentUser}
          />
        )}

        {activeMenu === 'edition_amended' && (
          <PlanDetail02View
            edition="amended"
            projects={projects}
            onAddProject={handleOpenAddProject}
            onEditProject={handleOpenEditProject}
            onViewProject={(p) => setViewDetailProject(p)}
            onViewHistory={(p) => setHistoryProject(p)}
            onDeleteProject={handleDeletePlanProject}
            onSaveNewProject={handleSavePlanProject}
            currentUser={currentUser}
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

        {/* Plan Budget Comparison Report View (รายงานเปรียบเทียบแผน/งบประมาณ) */}
        {activeMenu === 'report_comparison' && (
          <PlanBudgetComparisonReportView
            projects={projects}
            onOpenProjectDetail={(p) => setViewDetailProject(p)}
          />
        )}

        {/* Project Search View (ระบบสืบค้นโครงการแผนพัฒนาท้องถิ่น) */}
        {activeMenu === 'project_search' && (
          <ProjectSearchView
            projects={projects}
            onOpenProjectDetail={(p) => setViewDetailProject(p)}
          />
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

        {/* Dashboard Overview View (ระบบแดชบอร์ดภาพรวมและสถิติ) */}
        {activeMenu === 'dashboard' && (
          <DashboardOverviewView
            projects={projects}
            trackingItems={trackingItems}
            onNavigateToMenu={(menu) => setActiveMenu(menu)}
            onViewProjectDetail={(p) => setViewDetailProject(p)}
            currentUser={currentUser}
            onOpenVisitorAnalytics={() => setIsVisitorAnalyticsOpen(true)}
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
          activeMenu !== 'report_plan' &&
          activeMenu !== 'report_comparison' &&
          activeMenu !== 'project_search' &&
          activeMenu !== 'dashboard' && (
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
      {/* Plan Project Detail Modal (แบบ ผ.02 / ฉบับเปลี่ยนแปลง) */}
      <PlanProjectDetailModal
        project={viewDetailProject}
        allProjects={projects}
        onClose={() => setViewDetailProject(null)}
        onSave={handleSavePlanProject}
        onDelete={handleDeletePlanProject}
        currentUser={currentUser}
        readOnly={
          viewDetailProject?.status === 'approved' ||
          activeMenu === 'budget_approval' ||
          currentUser?.role === 'public' ||
          currentUser?.role === 'executive'
        }
      />

      {/* Plan Project Form Modal (+ เพิ่ม / แก้ไข โครงการ) */}
      <PlanProjectFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setFormProject(null);
        }}
        onSave={handleSavePlanProject}
        initialProject={formProject}
        defaultEdition={formTargetEdition}
        currentUser={currentUser}
        readOnly={currentUser?.role === 'public' || currentUser?.role === 'executive'}
      />

      {/* Plan History Modal */}
      <PlanHistoryModal
        project={historyProject}
        onClose={() => setHistoryProject(null)}
        currentUser={currentUser}
        isPublic={currentUser?.role === 'public'}
        onOpenNewChange={(p) => {
          if (currentUser?.role === 'public' || currentUser?.role === 'executive') return;
          setHistoryProject(null);
          setFormProject(p);
          setFormTargetEdition('changed');
          setIsFormModalOpen(true);
        }}
      />

      {/* Budget Allocation & Approval Modal */}
      <BudgetApprovalModal
        isOpen={isApprovalModalOpen}
        project={selectedApprovalProject}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setSelectedApprovalProject(null);
        }}
        onSave={handleSaveProjectApproval}
      />

      {/* Database / IndexedDB Storage Modal */}
      <DataStorageModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        projects={projects}
        onDataUpdated={handleDataUpdated}
      />

      {/* Google Sheets & GAS Sync Modal */}
      <GoogleSheetsSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        projects={projects}
        onDataUpdated={handleDataUpdated}
      />

      {/* Remaining Budget Modal */}
      <RemainingBudgetModal
        isOpen={isRemainingBudgetModalOpen}
        onClose={() => setIsRemainingBudgetModalOpen(false)}
        projects={projects}
        year="2571"
      />

      {/* Authentication & User Switch Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChanged={(user) => setCurrentUser(user)}
        onOpenAnalytics={() => setIsVisitorAnalyticsOpen(true)}
        initialTab={authModalTab}
      />

      {/* Public Citizen Access Modal */}
      <PublicVisitorModal
        isOpen={isPublicModalOpen}
        onClose={() => setIsPublicModalOpen(false)}
        onSuccess={(user) => setCurrentUser(user)}
      />

      {/* Visitor Analytics Modal */}
      <VisitorAnalyticsModal
        isOpen={isVisitorAnalyticsOpen}
        onClose={() => setIsVisitorAnalyticsOpen(false)}
      />
    </div>
  );
}
