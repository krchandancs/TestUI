import { useState } from 'react';

export function useSynopticModals() {
  const [internalNotesOpen,      setInternalNotesOpen]      = useState(false);
  const [isSimilarCasesOpen,     setIsSimilarCasesOpen]     = useState(false);
  const [isProfileOpen,          setIsProfileOpen]          = useState(false);
  const [isResourcesOpen,        setIsResourcesOpen]        = useState(false);
  const [showAbout,              setShowAbout]              = useState(false);
  const [showReportCommentModal, setShowReportCommentModal] = useState(false);
  const [showCaseCommentModal,   setShowCaseCommentModal]   = useState(false);
  const [showAddSynopticModal,   setShowAddSynopticModal]   = useState(false);
  const [showProtocolDropdown,   setShowProtocolDropdown]   = useState(false);
  const [showWarning,            setShowWarning]            = useState(false);
  const [showLogoutModal,        setShowLogoutModal]        = useState(false);
  const [showBulkConfirmPrompt,  setShowBulkConfirmPrompt] = useState(false);
  const [showReportPreview,      setShowReportPreview]      = useState(false);
  const [isExpandedView,         setIsExpandedView]         = useState(false);

  return {
    internalNotesOpen,      setInternalNotesOpen,
    isSimilarCasesOpen,     setIsSimilarCasesOpen,
    isProfileOpen,          setIsProfileOpen,
    isResourcesOpen,        setIsResourcesOpen,
    showAbout,              setShowAbout,
    showReportCommentModal, setShowReportCommentModal,
    showCaseCommentModal,   setShowCaseCommentModal,
    showAddSynopticModal,   setShowAddSynopticModal,
    showProtocolDropdown,   setShowProtocolDropdown,
    showWarning,            setShowWarning,
    showLogoutModal,        setShowLogoutModal,
    showBulkConfirmPrompt,  setShowBulkConfirmPrompt,
    showReportPreview,      setShowReportPreview,
    isExpandedView,         setIsExpandedView,
  };
}
